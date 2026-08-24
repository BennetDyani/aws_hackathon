'use client';

import { ActivityEntry } from '@/lib/types';

interface ActivityFeedProps {
  activities: ActivityEntry[];
  isLive?: boolean;
}

export default function ActivityFeed({ activities, isLive = false }: ActivityFeedProps) {
  return (
    <div className="card">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Investigation Activity</h3>
        {isLive && (
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-green-600 font-medium">Live</span>
          </span>
        )}
      </div>
      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="p-4 text-sm text-gray-400 text-center">
            No activity yet
          </div>
        ) : (
          activities.map((entry, index) => (
            <div key={index} className="px-4 py-3 flex items-start gap-3">
              <div className="mt-0.5">
                {entry.status === 'COMPLETED' ? (
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : entry.status === 'IN_PROGRESS' ? (
                  <svg className="w-4 h-4 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{entry.action}</p>
                {entry.tool_used && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Tool: {entry.tool_used}
                  </p>
                )}
              </div>
              <time className="text-xs text-gray-400 whitespace-nowrap">
                {new Date(entry.timestamp).toLocaleTimeString()}
              </time>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
