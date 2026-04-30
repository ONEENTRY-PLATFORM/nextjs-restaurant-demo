'use client';

import { useGSAP } from '@gsap/react';
import { useTransitionState } from 'next-transition-router';
import { useState } from 'react';

/**
 * useStage
 * @returns глобальные данные стадии (stage)
 */
const useStage = () => {
  const { stage } = useTransitionState();

  const [state, setState] = useState<string>('none');
  const [prevStage, setPrevStage] = useState<string>('');

  useGSAP(() => {
    // первая загрузка
    if (stage === 'none' && prevStage === '') {
      setState('play');
    }
    // стадия входа
    else if (stage === 'entering' && prevStage === 'leaving') {
      setState('enter');
    }
    // стадия выхода
    else if (stage === 'leaving' && prevStage === 'none') {
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
