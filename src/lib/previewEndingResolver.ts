export {
  choiceWeightMap,
  endingRedirectMap,
  applyChoiceWeight,
  resolveEndingRedirect,
  buildJudgmentInfo
} from './endingResolver';

export type {
  EndingJudgmentInfo,
  EndingResolverDeps,
  AddEndingModifierFn,
  GetLockedEndingFn,
  SelectWeightedEndingFn,
  GetAllEndingWeightsFn,
  ApplyTrustEndingWeightsFn
} from './endingResolver';
