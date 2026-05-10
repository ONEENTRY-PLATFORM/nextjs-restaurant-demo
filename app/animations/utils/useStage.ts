'use client';

import { useGSAP } from '@gsap/react';
import { useTransitionState } from 'next-transition-router';
import { useState } from 'react';

/**
 * useStage — returns the global stage data (`play` / `enter` / `leave`) derived from `next-transition-router`.
 *
 * @returns Current normalized stage plus the raw stage/prevStage for diagnostics.
 */
const useStage = () => {
  const { stage } = useTransitionState();

  const [state, setState] = useState<string>('none');
  const [prevStage, setPrevStage] = useState<string>('');

  useGSAP(() => {
    if (stage === 'none' && prevStage === '') {
      setState('play');
    } else if (stage === 'entering' && prevStage === 'leaving') {
      setState('enter');
    } else if (stage === 'leaving' && prevStage === 'none') {
      setState('leave');
    }

    setPrevStage(stage);
  }, [stage]);

  return {
    stage: state,
    stageData: {
      stage: stage,
      prevStage: prevStage,
    },
  };
};

export default useStage;
