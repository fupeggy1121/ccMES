export interface SamplingRuleOption {
  label: string;
  value: string;
}

export const SAMPLING_RULE_OPTIONS: SamplingRuleOption[] = [
  { label: '全检', value: 'full_inspection' },
  { label: '每个批次抽一片', value: 'one_per_batch_piece' },
  { label: '头中尾各抽一片', value: 'head_middle_tail_piece' },
  { label: '每个批次抽一盒', value: 'one_box_per_batch' },
];

export const getSamplingRuleLabel = (value?: string): string => {
  if (!value) return '-';
  return SAMPLING_RULE_OPTIONS.find(option => option.value === value)?.label || value;
};
