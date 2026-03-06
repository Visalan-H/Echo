import { useEffect, useState } from "react";
import type { JobApplication, JobStatus } from "../types/api";

type CountUpProps = {
  target: number;
};

type StatsRowProps = {
  data: JobApplication[];
};

function CountUp({ target }: CountUpProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let frameId = 0;
    const duration = 800;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      setCount(Math.floor(easeOut * target));

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };

    frameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [target]);

  return <span>{count}</span>;
}

function countByStatus(data: JobApplication[], status: JobStatus): number {
  return data.filter((job) => job.status === status).length;
}

export default function StatsRow({ data }: StatsRowProps) {
  const stats = [
    { label: "Total", value: data.length },
    { label: "Interviewing", value: countByStatus(data, "Interviewing") },
    { label: "Offered", value: countByStatus(data, "Offered") },
    { label: "Rejected", value: countByStatus(data, "Rejected") },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {stats.map((stat) => (
        <div 
          key={stat.label}
          className="p-5 border border-border bg-surface flex flex-col"
        >
          <span className="text-sm uppercase tracking-wider font-mono text-muted mb-3">{stat.label}</span>
          <div className="text-3xl font-semibold tracking-tight text-accent">
            <CountUp target={stat.value} />
          </div>
        </div>
      ))}
    </div>
  );
}
