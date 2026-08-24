// src/components/LossWaferAutocompleteInput.tsx
import React from 'react';
import { Autocomplete, TextField, Box } from '@mui/material';
import { WaferLossRecord } from '../types';

interface LossWaferAutocompleteInputProps {
  options: WaferLossRecord[]; // 此属性将从父组件传递
  value: string;
  onSelect: (selectedRecord: WaferLossRecord | null) => void;
}

const LossWaferAutocompleteInput: React.FC<LossWaferAutocompleteInputProps> = ({
  options,
  value,
  onSelect,
}) => {
  const selectedOption = options.find(option => option.waferId === value) || null;

  const handleChange = (
    event: React.SyntheticEvent,
    newValue: WaferLossRecord | null
  ) => {
    onSelect(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Autocomplete
        value={selectedOption}
        onChange={handleChange}
        options={options}
        getOptionLabel={(option) => option.waferId}
        isOptionEqualToValue={(option, value) => option.waferId === value.waferId}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            size="small"
            placeholder="搜索晶圆ID..."
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
                backgroundColor: 'background.paper',
                '&:hover fieldset': {
                  borderColor: 'primary.light',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                  borderWidth: 2,
                },
              },
              '& .MuiInputLabel-root': {
                fontSize: '0.875rem',
              },
            }}
          />
        )}
        sx={{
          '& .MuiAutocomplete-listbox': {
            fontSize: '0.875rem',
          },
          '& .MuiAutocomplete-option': {
            fontSize: '0.875rem',
            '&[aria-selected="true"]': {
              backgroundColor: 'primary.light',
              color: 'primary.contrastText',
            },
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          },
        }}
        noOptionsText="未找到晶圆"
      />
    </Box>
  );
};

export default LossWaferAutocompleteInput;
