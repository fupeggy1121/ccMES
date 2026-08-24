// src/components/LossWaferSelectionModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Paper,
  Typography,
  Box,
  TextField,
  Grid,
} from '@mui/material';
import { WaferLossRecord } from '../types';

interface LossWaferSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLossWafers: (selectedWafers: WaferLossRecord[]) => void;
  lossWafers: WaferLossRecord[]; // 此属性将从父组件传递
}

const LossWaferSelectionModal: React.FC<LossWaferSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectLossWafers,
  lossWafers,
}) => {
  // ... (组件逻辑保持不变，它将使用传入的 lossWafers 属性)
  const [selectedWafers, setSelectedWafers] = useState<WaferLossRecord[]>([]);
  const [waferIdFilter, setWaferIdFilter] = useState<string>('');
  const [originalLotIdFilter, setOriginalLotIdFilter] = useState<string>('');
  const [originalSublotIdFilter, setOriginalSublotIdFilter] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setSelectedWafers([]);
      setWaferIdFilter('');
      setOriginalLotIdFilter('');
      setOriginalSublotIdFilter('');
    }
  }, [isOpen]);

  const filteredLossWafers = useMemo(() => {
    return lossWafers.filter((wafer) => {
      const matchesWaferId = wafer.waferId
        .toLowerCase()
        .includes(waferIdFilter.toLowerCase());
      const matchesLotId = wafer.originalLotId
        .toLowerCase()
        .includes(originalLotIdFilter.toLowerCase());
      const matchesSublotId = wafer.originalSublotId
        .toLowerCase()
        .includes(originalSublotIdFilter.toLowerCase());

      return matchesWaferId && matchesLotId && matchesSublotId;
    });
  }, [lossWafers, waferIdFilter, originalLotIdFilter, originalSublotIdFilter]);

  const handleWaferSelect = (wafer: WaferLossRecord) => {
    const isSelected = selectedWafers.some(
      (selected) => selected.waferId === wafer.waferId
    );

    if (isSelected) {
      setSelectedWafers(
        selectedWafers.filter((selected) => selected.waferId !== wafer.waferId)
      );
    } else {
      setSelectedWafers([...selectedWafers, wafer]);
    }
  };

  const handleSelectAll = () => {
    if (selectedWafers.length === filteredLossWafers.length) {
      setSelectedWafers([]);
    } else {
      setSelectedWafers([...filteredLossWafers]);
    }
  };

  const handleConfirm = () => {
    onSelectLossWafers(selectedWafers);
    onClose();
  };

  const handleCancel = () => {
    setSelectedWafers([]);
    onClose();
  };

  const isAllSelected = filteredLossWafers.length > 0 &&
    selectedWafers.length === filteredLossWafers.length;

  return (
    <Dialog
      open={isOpen}
      onClose={handleCancel}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' }
      }}
    >
      <DialogTitle>
        <Typography variant="h6" component="div">
          选择 Loss 晶圆片
        </Typography>
        <Typography variant="body2" color="text.secondary">
          请从以下列表中选择需要处理的 Loss 晶圆片
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="过滤晶圆ID"
                variant="outlined"
                size="small"
                value={waferIdFilter}
                onChange={(e) => setWaferIdFilter(e.target.value)}
                placeholder="输入晶圆ID..."
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="过滤原始批次ID"
                variant="outlined"
                size="small"
                value={originalLotIdFilter}
                onChange={(e) => setOriginalLotIdFilter(e.target.value)}
                placeholder="输入原始批次ID..."
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="过滤原始子批次ID"
                variant="outlined"
                size="small"
                value={originalSublotIdFilter}
                onChange={(e) => setOriginalSublotIdFilter(e.target.value)}
                placeholder="输入原始子批次ID..."
              />
            </Grid>
          </Grid>
        </Box>

        <TableContainer component={Paper} variant="outlined">
          <Table sx={{ minWidth: 650 }} aria-label="loss wafer selection table">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    indeterminate={
                      selectedWafers.length > 0 &&
                      selectedWafers.length < filteredLossWafers.length
                    }
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    inputProps={{
                      'aria-label': 'select all wafers',
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight="bold">
                    晶圆ID
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight="bold">
                    原始子批次ID
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight="bold">
                    原始批次ID
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight="bold">
                    原始载具ID
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLossWafers.length > 0 ? (
                filteredLossWafers.map((wafer) => {
                  const isSelected = selectedWafers.some(
                    (selected) => selected.waferId === wafer.waferId
                  );

                  return (
                    <TableRow
                      key={wafer.waferId}
                      hover
                      onClick={() => handleWaferSelect(wafer)}
                      sx={{
                        cursor: 'pointer',
                        backgroundColor: isSelected ? 'action.selected' : 'inherit',
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="primary"
                          checked={isSelected}
                          onChange={() => handleWaferSelect(wafer)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                      <TableCell>{wafer.waferId}</TableCell>
                      <TableCell>{wafer.originalSublotId}</TableCell>
                      <TableCell>{wafer.originalLotId}</TableCell>
                      <TableCell>{wafer.originalCarrierId}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      {lossWafers.length === 0
                        ? "暂无 Loss 晶圆数据"
                        : "没有找到匹配的晶圆数据"}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {lossWafers.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              已选择 {selectedWafers.length} / {filteredLossWafers.length} 个晶圆片
              {filteredLossWafers.length !== lossWafers.length &&
                ` (总共 ${lossWafers.length} 个)`
              }
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleCancel} color="inherit">
          取消
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={selectedWafers.length === 0}
        >
          确认选择 ({selectedWafers.length})
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LossWaferSelectionModal;
