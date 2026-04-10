import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as random from "@pulumi/random";

// =============================================================================
// Configuration
// =============================================================================

const config = new pulumi.Config();

const appName = config.get("appName") || "10xlegal-server";
const frontendUrl = config.require("frontendUrl");
const jwtSecret = config.requireSecret("jwtSecret");

const containerPort = parseInt(config.get("containerPort") || "3000");
const cpu = parseInt(config.get("cpu") || "256");
const memory = parseInt(config.get("memory") || "512");
const desiredCount = parseInt(config.get("desiredCount") || "1");
const imageTag = config.get("imageTag") || "latest";

const dbInstanceClass = config.get("dbInstanceClass") || "db.t4g.micro";
const dbAllocatedStorage = parseInt(config.get("dbAllocatedStorage") || "20");
const dbUsername = config.get("dbUsername") || "appuser";
const dbName = config.get("dbName") || appName.replace(/-/g, "_");

const certificateArn = config.get("certificateArn");

const tags = {
  Project: "10xlegal",
  App: appName,
  ManagedBy: "pulumi",
};

// =============================================================================
// Networking — dedicated VPC, two AZs, no NAT gateway (cost optimization).
// ECS tasks run in public subnets with public IPs so they can reach ECR;
// RDS lives in private subnets reachable only from the app security group.
// =============================================================================

const azs = aws.getAvailabilityZones({ state: "available" });

const vpc = new aws.ec2.Vpc(`${appName}-vpc`, {
  cidrBlock: "10.0.0.0/16",
  enableDnsHostnames: true,
  enableDnsSupport: true,
  tags: { ...tags, Name: `${appName}-vpc` },
});

const igw = new aws.ec2.InternetGateway(`${appName}-igw`, {
  vpcId: vpc.id,
  tags: { ...tags, Name: `${appName}-igw` },
});

const publicSubnetA = new aws.ec2.Subnet(`${appName}-public-a`, {
  vpcId: vpc.id,
  cidrBlock: "10.0.0.0/24",
  availabilityZone: azs.then((a) => a.names[0]!),
  mapPublicIpOnLaunch: true,
  tags: { ...tags, Name: `${appName}-public-a`, Tier: "public" },
});

const publicSubnetB = new aws.ec2.Subnet(`${appName}-public-b`, {
  vpcId: vpc.id,
  cidrBlock: "10.0.1.0/24",
  availabilityZone: azs.then((a) => a.names[1]!),
  mapPublicIpOnLaunch: true,
  tags: { ...tags, Name: `${appName}-public-b`, Tier: "public" },
});

const privateSubnetA = new aws.ec2.Subnet(`${appName}-private-a`, {
  vpcId: vpc.id,
  cidrBlock: "10.0.10.0/24",
  availabilityZone: azs.then((a) => a.names[0]!),
  tags: { ...tags, Name: `${appName}-private-a`, Tier: "private" },
});

const privateSubnetB = new aws.ec2.Subnet(`${appName}-private-b`, {
  vpcId: vpc.id,
  cidrBlock: "10.0.11.0/24",
  availabilityZone: azs.then((a) => a.names[1]!),
  tags: { ...tags, Name: `${appName}-private-b`, Tier: "private" },
});

const publicRouteTable = new aws.ec2.RouteTable(`${appName}-public-rt`, {
  vpcId: vpc.id,
  routes: [{ cidrBlock: "0.0.0.0/0", gatewayId: igw.id }],
  tags: { ...tags, Name: `${appName}-public-rt` },
});

new aws.ec2.RouteTableAssociation(`${appName}-public-rta-a`, {
  subnetId: publicSubnetA.id,
  routeTableId: publicRouteTable.id,
});

new aws.ec2.RouteTableAssociation(`${appName}-public-rta-b`, {
  subnetId: publicSubnetB.id,
  routeTableId: publicRouteTable.id,
});

const privateRouteTable = new aws.ec2.RouteTable(`${appName}-private-rt`, {
  vpcId: vpc.id,
  tags: { ...tags, Name: `${appName}-private-rt` },
});

new aws.ec2.RouteTableAssociation(`${appName}-private-rta-a`, {
  subnetId: privateSubnetA.id,
  routeTableId: privateRouteTable.id,
});

new aws.ec2.RouteTableAssociation(`${appName}-private-rta-b`, {
  subnetId: privateSubnetB.id,
  routeTableId: privateRouteTable.id,
});

// =============================================================================
// Security Groups
// =============================================================================

const albSg = new aws.ec2.SecurityGroup(`${appName}-alb-sg`, {
  vpcId: vpc.id,
  description: "Public ALB ingress",
  ingress: [
    { protocol: "tcp", fromPort: 80, toPort: 80, cidrBlocks: ["0.0.0.0/0"], description: "HTTP" },
    { protocol: "tcp", fromPort: 443, toPort: 443, cidrBlocks: ["0.0.0.0/0"], description: "HTTPS" },
  ],
  egress: [{ protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] }],
  tags: { ...tags, Name: `${appName}-alb-sg` },
});

const appSg = new aws.ec2.SecurityGroup(`${appName}-app-sg`, {
  vpcId: vpc.id,
  description: "ECS app tasks",
  ingress: [{
    protocol: "tcp",
    fromPort: containerPort,
    toPort: containerPort,
    securityGroups: [albSg.id],
    description: "From ALB",
  }],
  egress: [{ protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] }],
  tags: { ...tags, Name: `${appName}-app-sg` },
});

const dbSg = new aws.ec2.SecurityGroup(`${appName}-db-sg`, {
  vpcId: vpc.id,
  description: "RDS Postgres",
  ingress: [{
    protocol: "tcp",
    fromPort: 5432,
    toPort: 5432,
    securityGroups: [appSg.id],
    description: "From app tasks",
  }],
  egress: [{ protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] }],
  tags: { ...tags, Name: `${appName}-db-sg` },
});

// =============================================================================
// RDS PostgreSQL
// =============================================================================

const dbSubnetGroup = new aws.rds.SubnetGroup(`${appName}-db-subnets`, {
  subnetIds: [privateSubnetA.id, privateSubnetB.id],
  tags: { ...tags, Name: `${appName}-db-subnets` },
});

const dbPassword = new random.RandomPassword(`${appName}-db-password`, {
  length: 32,
  special: true,
  overrideSpecial: "_-",
});

const dbPasswordSecret = new aws.secretsmanager.Secret(`${appName}-db-password-secret`, {
  name: `${appName}/db-password`,
  description: `Master password for ${appName} RDS instance`,
  tags,
});

new aws.secretsmanager.SecretVersion(`${appName}-db-password-secret-version`, {
  secretId: dbPasswordSecret.id,
  secretString: dbPassword.result,
});

const dbInstance = new aws.rds.Instance(`${appName}-db`, {
  identifier: `${appName}-db`,
  engine: "postgres",
  engineVersion: "16.4",
  instanceClass: dbInstanceClass,
  allocatedStorage: dbAllocatedStorage,
  storageType: "gp3",
  storageEncrypted: true,
  dbName,
  username: dbUsername,
  password: dbPassword.result,
  dbSubnetGroupName: dbSubnetGroup.name,
  vpcSecurityGroupIds: [dbSg.id],
  publiclyAccessible: false,
  multiAz: false,
  backupRetentionPeriod: 7,
  skipFinalSnapshot: true,
  deletionProtection: false,
  applyImmediately: true,
  tags: { ...tags, Name: `${appName}-db` },
});

// =============================================================================
// CloudWatch Logs
// =============================================================================

const logGroup = new aws.cloudwatch.LogGroup(`${appName}-logs`, {
  name: `/ecs/${appName}`,
  retentionInDays: 14,
  tags,
});

// =============================================================================
// IAM — Task Execution Role + Task Role
// =============================================================================

const ecsAssumeRolePolicy = JSON.stringify({
  Version: "2012-10-17",
  Statement: [{
    Effect: "Allow",
    Principal: { Service: "ecs-tasks.amazonaws.com" },
    Action: "sts:AssumeRole",
  }],
});

const taskExecutionRole = new aws.iam.Role(`${appName}-task-execution-role`, {
  assumeRolePolicy: ecsAssumeRolePolicy,
  tags,
});

new aws.iam.RolePolicyAttachment(`${appName}-task-execution-managed`, {
  role: taskExecutionRole.name,
  policyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
});

// The managed policy above does NOT include Secrets Manager access — add it
// inline so the task definition can pull DB_PASSWORD from Secrets Manager.
new aws.iam.RolePolicy(`${appName}-task-execution-secrets`, {
  role: taskExecutionRole.id,
  policy: dbPasswordSecret.arn.apply((arn) => JSON.stringify({
    Version: "2012-10-17",
    Statement: [{
      Effect: "Allow",
      Action: ["secretsmanager:GetSecretValue"],
      Resource: arn,
    }],
  })),
});

const taskRole = new aws.iam.Role(`${appName}-task-role`, {
  assumeRolePolicy: ecsAssumeRolePolicy,
  tags,
});

// =============================================================================
// ECR Repository
// =============================================================================

const ecrRepo = new aws.ecr.Repository(`${appName}-repo`, {
  name: appName,
  imageTagMutability: "MUTABLE",
  imageScanningConfiguration: { scanOnPush: true },
  forceDelete: true,
  tags,
});

new aws.ecr.LifecyclePolicy(`${appName}-repo-lifecycle`, {
  repository: ecrRepo.name,
  policy: JSON.stringify({
    rules: [{
      rulePriority: 1,
      description: "Keep last 10 images",
      selection: { tagStatus: "any", countType: "imageCountMoreThan", countNumber: 10 },
      action: { type: "expire" },
    }],
  }),
});

// =============================================================================
// ECS Cluster
// =============================================================================

const cluster = new aws.ecs.Cluster(`${appName}-cluster`, {
  name: `${appName}-cluster`,
  settings: [{ name: "containerInsights", value: "disabled" }],
  tags,
});

// =============================================================================
// Application Load Balancer
// =============================================================================

const alb = new aws.lb.LoadBalancer(`${appName}-alb`, {
  loadBalancerType: "application",
  internal: false,
  securityGroups: [albSg.id],
  subnets: [publicSubnetA.id, publicSubnetB.id],
  tags: { ...tags, Name: `${appName}-alb` },
});

const targetGroup = new aws.lb.TargetGroup(`${appName}-tg`, {
  port: containerPort,
  protocol: "HTTP",
  vpcId: vpc.id,
  targetType: "ip",
  healthCheck: {
    enabled: true,
    path: "/health",
    healthyThreshold: 2,
    unhealthyThreshold: 3,
    timeout: 5,
    interval: 30,
    matcher: "200",
  },
  deregistrationDelay: 30,
  tags,
});

const httpListener = new aws.lb.Listener(`${appName}-http`, {
  loadBalancerArn: alb.arn,
  port: 80,
  protocol: "HTTP",
  defaultActions: certificateArn
    ? [{
        type: "redirect",
        redirect: { protocol: "HTTPS", port: "443", statusCode: "HTTP_301" },
      }]
    : [{ type: "forward", targetGroupArn: targetGroup.arn }],
  tags,
});

const httpsListener = certificateArn
  ? new aws.lb.Listener(`${appName}-https`, {
      loadBalancerArn: alb.arn,
      port: 443,
      protocol: "HTTPS",
      sslPolicy: "ELBSecurityPolicy-TLS13-1-2-2021-06",
      certificateArn,
      defaultActions: [{ type: "forward", targetGroupArn: targetGroup.arn }],
      tags,
    })
  : undefined;

// =============================================================================
// ECS Task Definition + Service
// =============================================================================

const containerDefinitions = pulumi
  .all([
    ecrRepo.repositoryUrl,
    logGroup.name,
    dbInstance.address,
    dbPasswordSecret.arn,
    jwtSecret,
    aws.config.requireRegion(),
  ])
  .apply(([repoUrl, logGroupName, dbHost, dbSecretArn, jwt, region]) =>
    JSON.stringify([{
      name: appName,
      image: `${repoUrl}:${imageTag}`,
      essential: true,
      portMappings: [{ containerPort, protocol: "tcp" }],
      environment: [
        { name: "NODE_ENV", value: "production" },
        { name: "PORT", value: containerPort.toString() },
        { name: "FRONTEND_URL", value: frontendUrl },
        { name: "JWT_SECRET", value: jwt },
        { name: "DB_HOST", value: dbHost },
        { name: "DB_PORT", value: "5432" },
        { name: "DB_NAME", value: dbName },
        { name: "DB_USER", value: dbUsername },
        { name: "IMAGE_TAG", value: imageTag },
      ],
      secrets: [
        { name: "DB_PASSWORD", valueFrom: dbSecretArn },
      ],
      logConfiguration: {
        logDriver: "awslogs",
        options: {
          "awslogs-group": logGroupName,
          "awslogs-region": region,
          "awslogs-stream-prefix": appName,
        },
      },
      healthCheck: {
        command: ["CMD-SHELL", `curl -f http://localhost:${containerPort}/health || exit 1`],
        interval: 30,
        timeout: 5,
        retries: 3,
        startPeriod: 60,
      },
    }]),
  );

const taskDefinition = new aws.ecs.TaskDefinition(`${appName}-task`, {
  family: appName,
  cpu: cpu.toString(),
  memory: memory.toString(),
  networkMode: "awsvpc",
  requiresCompatibilities: ["FARGATE"],
  executionRoleArn: taskExecutionRole.arn,
  taskRoleArn: taskRole.arn,
  containerDefinitions,
  tags,
});

const service = new aws.ecs.Service(
  `${appName}-service`,
  {
    name: appName,
    cluster: cluster.arn,
    taskDefinition: taskDefinition.arn,
    desiredCount,
    launchType: "FARGATE",
    networkConfiguration: {
      subnets: [publicSubnetA.id, publicSubnetB.id],
      securityGroups: [appSg.id],
      assignPublicIp: true,
    },
    loadBalancers: [{
      targetGroupArn: targetGroup.arn,
      containerName: appName,
      containerPort,
    }],
    deploymentMinimumHealthyPercent: 50,
    deploymentMaximumPercent: 200,
    healthCheckGracePeriodSeconds: 60,
    propagateTags: "SERVICE",
    tags,
  },
  {
    dependsOn: httpsListener ? [httpListener, httpsListener] : [httpListener],
  },
);

// =============================================================================
// Outputs
// =============================================================================

export const vpcId = vpc.id;
export const ecrRepositoryUrl = ecrRepo.repositoryUrl;
export const clusterName = cluster.name;
export const serviceName = service.name;
export const dbEndpoint = dbInstance.address;
export const dbPasswordSecretArn = dbPasswordSecret.arn;
export const albDnsName = alb.dnsName;
export const appUrl = certificateArn
  ? pulumi.interpolate`https://${alb.dnsName}`
  : pulumi.interpolate`http://${alb.dnsName}`;
