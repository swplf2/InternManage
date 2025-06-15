// React Debug Helper for TasksPage
// Add this to TasksPage.tsx if needed for deeper debugging

import { useRef, useEffect, useState, useCallback } from 'react';

// Custom hook to debug why component re-renders
export function useWhyDidYouUpdate(name: string, props: Record<string, any>) {
  const previous = useRef<Record<string, any>>();
  
  useEffect(() => {
    if (previous.current) {
      const allKeys = Object.keys({ ...previous.current, ...props });
      const changedProps: Record<string, any> = {};
      
      allKeys.forEach(key => {
        if (previous.current![key] !== props[key]) {
          changedProps[key] = {
            from: previous.current![key],
            to: props[key]
          };
        }
      });
      
      if (Object.keys(changedProps).length) {
        console.log('🔍 [why-did-you-update]', name, changedProps);
      }
    }
    
    previous.current = props;
  });
}

// Usage in TasksPage:
// useWhyDidYouUpdate('TasksPage', { 
//   tasks, 
//   loading, 
//   renderCounter, 
//   tableKey, 
//   recentlyUpdatedTaskId 
// });

// Force re-render utility
export function useForceUpdate() {
  const [, setTick] = useState(0);
  const update = useCallback(() => {
    setTick((tick: number) => tick + 1);
  }, []);
  return update;
}

// Debug component state
export function logComponentState(componentName: string, state: any) {
  console.log(`🎭 [${componentName}] State:`, {
    ...state,
    timestamp: new Date().toISOString()
  });
}
