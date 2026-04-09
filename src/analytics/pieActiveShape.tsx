import { Sector, type PieSectorDataItem } from 'recharts';

export function renderActiveShape(props: PieSectorDataItem) {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props as {
        cx: number; cy: number; innerRadius: number; outerRadius: number;
        startAngle: number; endAngle: number; fill: string;
    };
    return (
        <Sector
            cx={cx}
            cy={cy}
            innerRadius={innerRadius - 3}
            outerRadius={outerRadius + 6}
            startAngle={startAngle}
            endAngle={endAngle}
            fill={fill}
            opacity={0.9}
        />
    );
}
