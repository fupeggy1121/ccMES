import React, { useState } from 'react';

interface NodeInfo {
  id: string;
  title: string;
  desc: string;
}

const NODE_INFO: NodeInfo[] = [
  {
    id: 'wip',
    title: '在制品（WIP）',
    desc: '处于生产流程中的晶圆批次（Lot/Wafer），在各工艺或量测站点流转中。',
  },
  {
    id: 'detect',
    title: '工艺/量测站点检测',
    desc: '各检测站点（膜厚量测、CD-SEM、缺陷扫描、电测等）对在制品进行检测，生成检测结果。系统根据规格上下限自动判断是否合格。',
  },
  {
    id: 'pass',
    title: '合格 → 继续流转',
    desc: '检测结果符合规格要求，批次释放Hold状态，继续流向下一工艺站点，正常推进生产。',
  },
  {
    id: 'hold',
    title: '自动锁定（Hold）& 物理隔离',
    desc: '检测结果超出规格，MES/FDC立即将对应批次置为"Hold"状态，禁止下一步移动。\n操作员将材料移入专用"待判区/红区"，贴附"不良待处理"红色标签防止混料。系统生成初始不合格品报告（NCR），记录站点、时间、不良代码、层别坐标等。',
  },
  {
    id: 'mrb',
    title: '不良品评审（MRB）',
    desc: '由工艺、设备、质量、产品工程师组成的评审委员会，基于缺陷类型、位置、工艺能力和客户规格做出处置决定。\n通常在QMS（质量管理系统）中发起与记录，须多方电子签名。结论有三种：返工、直接报废、残值回收/特采。',
  },
  {
    id: 'rework',
    title: '返工（Rework）',
    desc: 'MES生成专用返工工艺路径（Rework Route），批次重新进入产线执行返工步骤。\n操作员扫描批次标签，系统仅允许其移动至返工站点，硬性防错。系统设置最大返工次数限制（如光刻≤3次），超出强制转报废评审。\n返工完成后须重新经过工艺/量测检测，合格则释放Hold回主线继续正常生产；不合格再次进入MRB评审。',
  },
  {
    id: 'rework_batch',
    title: '攒批（返工路径）',
    desc: '返工完成后，将通过检测的返工片汇集凑成完整批次，统一移出暂存区重新投入产线。\nMES中更新批次数量及状态，确保账实一致。',
  },
  {
    id: 'rework_moveout',
    title: '移出暂存区（返工路径）',
    desc: '攒批完成后，操作员在MES中执行"Move from Hold Area"事务，将批次从暂存区/Hold区移出，解除物理隔离状态。\nMES自动将批次状态恢复为正常在制（WIP），路径切回主工艺路径，批次重新进入产线流转。',
  },
  {
    id: 'scrap',
    title: '直接报废（Scrap）',
    desc: 'MRB授权后，在MES中执行"Scrap"操作（需主管/质量电子签名），MES实时扣减WIP数量。\n物理销毁：晶圆破片/划片，封装品压碎或激光打标，需在监控下操作，防止废料非法再利用。废料放入专用废品箱，定期清运。\n报废数量及不良信息写入MES数据库，纳入良率分析，不额外推送ERP仓储事务。',
  },
  {
    id: 'salvage',
    title: '判定残值 — 进入回收流程',
    desc: 'MRB评审结论为"残值回收"，批次从Hold区转入残值暂存区，开始进入独立的不良品回收流程。\n残值材料按品种、等级（A级残片/B级残片）分拣归类，等待攒批处理。',
  },
  {
    id: 'batch_collect',
    title: '攒批（残值路径）',
    desc: '将零散残值材料按品种、尺寸或等级汇集，凑满一个独立处理批次（如满50片/盒）后统一进入后续处理流程。\nMES中建立"NCM批次"记录，关联各源批次的不良信息及数量。',
  },
  {
    id: 'salvage_moveout',
    title: '移出暂存区（残值路径）',
    desc: '攒批完成后，操作员在MES中执行"Move from Hold Area"事务，将残值批次从暂存区移出，MES同时为该批次分配独立的不良品处理路径（NCM Route）。\n该路径包含清洗、不良品包装等专用工艺站点，与正常产线隔离，防止混线。',
  },
  {
    id: 'cleaning',
    title: '清洗（Cleaning）',
    desc: '对攒批完成的残值材料进行标准清洗工序，去除表面污染物、残留化学品及颗粒物，符合包装和储存的洁净要求。\n清洗记录（批次号、清洗站点、操作员、时间）写入MES，确保全程可追溯。',
  },
  {
    id: 'ncm_pack',
    title: '不良品包装（NCM Packaging）',
    desc: '按不良品包装规范完成封装：真空包装或防静电袋封装，贴附"不良品标签"（含批次号、不良代码、等级、日期）。\n包装完成后，操作员在MES中确认包装数量与批次信息，系统生成不良品入库申请单。',
  },
  {
    id: 'ncm_wh',
    title: 'MES线边仓入库',
    desc: 'MES执行"Move to NCM Location"事务，将不良品批次状态变更为"线边仓库存"，库位记录为指定不良品线边仓（NCM Line-side WH）。\n系统自动生成不良品入库单，记录品种、数量、等级、存放库位。入库后等待出库指令。',
  },
  {
    id: 'ncm_wh_out',
    title: 'MES线边仓出库',
    desc: 'MES执行"Issue from NCM Location"事务，将不良品从线边仓出库，MES减少线边仓库存数量。\n出库操作触发接口推送至ERP，ERP在独立不良品仓库（NCM Warehouse，冻结库存）增加库存，完成账实同步。',
  },
  {
    id: 'erp_ncm',
    title: '推送ERP不良品仓',
    desc: 'MES线边仓入库完成后，接口将不良品入库单数据推送至ERP独立的不良品仓库（NCM Warehouse，冻结库存）。\nERP创建副产品入库凭证，生产成本差异入账；不良品库存受冻结状态管控，不可正常销售出库，需经专项审批（降级客户特采/回收商处置）方可发货。\n财务月末对不良品库存进行跌价测试，按规确认减值损失。',
  },
  {
    id: 'analysis',
    title: '数据追溯 & 良率分析闭环',
    desc: '所有不良处置将不良代码、站点、处置方式、根因记录在MES数据库。\n良率管理系统（YMS）生成日常报告：站点报废率、返工率、Top-10缺陷、报废成本金额。\n当某站点返工/报废率异常飙升时，触发工艺/设备工程师进行根因分析（RCA）和改进行动，形成PDCA闭环。',
  },
];

// -------- SVG layout constants --------
const W = 960;

// Node shapes
const BOX_W = 140;
const BOX_H = 40;
const DIAMOND_W = 130;
const DIAMOND_H = 50;

// X centers
const CX_MAIN = 480;
const CX_LEFT = 150;
const CX_RIGHT = 820;

// Y positions — main spine
const Y_WIP = 50;
const Y_DETECT = 140;
const Y_DECISION = 230;
const Y_HOLD = 330;
const Y_MRB = 420;
const Y_DECISION2 = 510;

// Three branch first row
const Y_REWORK = 620;
const Y_SCRAP = 620;
const Y_SALVAGE = 620;

// Left branch — Rework path
const Y_REWORK_BATCH = 720;
const Y_REWORK_MOVEOUT = 820;

// Right branch — Salvage path
const Y_BATCH = 720;
const Y_SALVAGE_MOVEOUT = 820;
const Y_CLEAN = 930;
const Y_PACK = 1030;
const Y_NCM_WH = 1140;
const Y_NCM_WH_OUT = 1240;
const Y_ERP_NCM = 1340;

// Bottom analysis node
const Y_ANALYSIS = 1440;

// Colors
const CLR_PROCESS = '#3B82F6';
const CLR_DECISION = '#F59E0B';
const CLR_OK = '#10B981';
const CLR_HOLD = '#EF4444';
const CLR_MRB = '#8B5CF6';
const CLR_REWORK = '#06B6D4';
const CLR_SCRAP = '#6B7280';
const CLR_SALVAGE = '#F97316';
const CLR_NCM = '#FB923C';
const CLR_ERP_NCM = '#0EA5E9';
const CLR_ANALYSIS = '#14B8A6';

function roundedRect(x: number, y: number, w: number, h: number, r = 6) {
  return `M${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} H${x + r} Q${x},${y + h} ${x},${y + h - r} V${y + r} Q${x},${y} ${x + r},${y} Z`;
}

function diamond(cx: number, cy: number, hw: number, hh: number) {
  return `M${cx},${cy - hh} L${cx + hw},${cy} L${cx},${cy + hh} L${cx - hw},${cy} Z`;
}

interface FlowNodeProps {
  id: string;
  x: number;
  y: number;
  label: string;
  color: string;
  selected: boolean;
  onClick: (id: string) => void;
  shape?: 'rect' | 'diamond';
}

function FlowNode({ id, x, y, label, color, selected, onClick, shape = 'rect' }: FlowNodeProps) {
  const bw = shape === 'diamond' ? DIAMOND_W : BOX_W;
  const bh = shape === 'diamond' ? DIAMOND_H : BOX_H;
  const rx = x - bw / 2;
  const ry = y - bh / 2;

  const pathD = shape === 'diamond'
    ? diamond(x, y, bw / 2, bh / 2)
    : roundedRect(rx, ry, bw, bh, 7);

  const lines = label.split('\n');

  return (
    <g
      onClick={() => onClick(id)}
      style={{ cursor: 'pointer' }}
    >
      <path
        d={pathD}
        fill={selected ? color : `${color}22`}
        stroke={color}
        strokeWidth={selected ? 2.5 : 1.5}
        style={{ transition: 'all 0.15s' }}
      />
      {lines.map((line, i) => (
        <text
          key={i}
          x={x}
          y={y + (lines.length === 1 ? 0 : (i - (lines.length - 1) / 2) * 14) + 4}
          textAnchor="middle"
          fontSize={11}
          fontWeight={selected ? 700 : 500}
          fill={selected ? '#fff' : color}
          style={{ userSelect: 'none', transition: 'all 0.15s' }}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function Arrow({ x1, y1, x2, y2, label, color = '#94A3B8' }: {
  x1: number; y1: number; x2: number; y2: number; label?: string; color?: string;
}) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  return (
    <g>
      <defs>
        <marker id={`arrow-${color.replace('#', '')}`} markerWidth="7" markerHeight="7"
          refX="5" refY="3.5" orient="auto">
          <polygon points="0 0, 7 3.5, 0 7" fill={color} />
        </marker>
      </defs>
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color}
        strokeWidth={1.5}
        markerEnd={`url(#arrow-${color.replace('#', '')})`}
      />
      {label && (
        <text x={mx + 4} y={my - 4} fontSize={10} fill={color} fontWeight={500}>{label}</text>
      )}
    </g>
  );
}

function ElbowArrow({ points, label, labelIdx, color = '#94A3B8' }: {
  points: [number, number][]; label?: string; labelIdx?: number; color?: string;
}) {
  if (points.length < 2) return null;
  const lIdx = labelIdx ?? Math.floor(points.length / 2);
  const labelPt = points[lIdx];
  return (
    <g>
      <defs>
        <marker id={`earrow-${color.replace('#', '')}`} markerWidth="7" markerHeight="7"
          refX="5" refY="3.5" orient="auto">
          <polygon points="0 0, 7 3.5, 0 7" fill={color} />
        </marker>
      </defs>
      <polyline
        points={points.map(p => p.join(',')).join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        markerEnd={`url(#earrow-${color.replace('#', '')})`}
      />
      {label && (
        <text x={labelPt[0] + 5} y={labelPt[1] - 4} fontSize={10} fill={color} fontWeight={500}>{label}</text>
      )}
    </g>
  );
}

interface DefectFlowOverlayProps {
  onClose: () => void;
}

export default function DefectFlowOverlay({ onClose }: DefectFlowOverlayProps) {
  const [selected, setSelected] = useState<string | null>('hold');

  const selectedInfo = NODE_INFO.find(n => n.id === selected);

  const handleSelect = (id: string) => {
    setSelected(prev => (prev === id ? null : id));
  };

  // ---- Layout ----
  // Main spine: WIP→detect→decision→hold→MRB→decision2
  // Left branch:  返工(Rework) → loop-back arrow to production line
  // Center:       报废(Scrap)  → analysis
  // Right branch: 残值→攒批→清洗→NCM包装→MES线边仓→ERP不良品仓 → analysis

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(15,23,42,0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'stretch',
      justifyContent: 'stretch',
      padding: '5mm',
    }}>
      <div style={{
        background: '#0F172A',
        border: '1px solid #1E3A5F',
        borderRadius: 12,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid #1E3A5F',
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ margin: 0, color: '#F1F5F9', fontSize: 18, fontWeight: 700, letterSpacing: 1 }}>
              产线不良品处置流程
            </h2>
            <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: 12 }}>
              点击流程节点查看详细业务说明
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.4)',
              borderRadius: 8,
              color: '#F87171',
              width: 32,
              height: 32,
              fontSize: 18,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          minHeight: 0,
        }}>
          {/* SVG flowchart */}
          <div style={{
            flex: '0 0 58%',
            overflowY: 'auto',
            overflowX: 'hidden',
            minHeight: 0,
            padding: '16px 8px 16px 16px',
            borderRight: '1px solid #1E3A5F',
          }}>
            <svg
              viewBox={`0 0 ${W} 1500`}
              width="100%"
              style={{ display: 'block', height: 'auto' }}
            >
              {/* ===== ARROWS ===== */}

              {/* Main spine */}
              <Arrow x1={CX_MAIN} y1={Y_WIP + 20} x2={CX_MAIN} y2={Y_DETECT - 20} color="#475569" />
              <Arrow x1={CX_MAIN} y1={Y_DETECT + 20} x2={CX_MAIN} y2={Y_DECISION - 25} color="#475569" />

              {/* decision → pass (合格, right) */}
              <ElbowArrow
                points={[[CX_MAIN + 65, Y_DECISION], [CX_RIGHT, Y_DECISION], [CX_RIGHT, Y_DECISION + 20]]}
                label="合格" color={CLR_OK}
              />

              {/* decision → hold (不合格, down) */}
              <Arrow x1={CX_MAIN} y1={Y_DECISION + 25} x2={CX_MAIN} y2={Y_HOLD - 20}
                label="不合格" color={CLR_HOLD} />

              <Arrow x1={CX_MAIN} y1={Y_HOLD + 20} x2={CX_MAIN} y2={Y_MRB - 20} color="#475569" />
              <Arrow x1={CX_MAIN} y1={Y_MRB + 20} x2={CX_MAIN} y2={Y_DECISION2 - 25} color="#475569" />

              {/* decision2 → three branches */}
              <ElbowArrow
                points={[[CX_MAIN - 65, Y_DECISION2], [CX_LEFT, Y_DECISION2], [CX_LEFT, Y_REWORK - 20]]}
                label="返工" color={CLR_REWORK}
              />
              <Arrow x1={CX_MAIN} y1={Y_DECISION2 + 25} x2={CX_MAIN} y2={Y_SCRAP - 20}
                label="报废" color={CLR_SCRAP} />
              <ElbowArrow
                points={[[CX_MAIN + 65, Y_DECISION2], [CX_RIGHT, Y_DECISION2], [CX_RIGHT, Y_SALVAGE - 20]]}
                label="残值" color={CLR_SALVAGE}
              />

              {/* ── Left: Rework path ── */}
              <Arrow x1={CX_LEFT} y1={Y_REWORK + 20} x2={CX_LEFT} y2={Y_REWORK_BATCH - 20} color={CLR_REWORK} />
              <Arrow x1={CX_LEFT} y1={Y_REWORK_BATCH + 20} x2={CX_LEFT} y2={Y_REWORK_MOVEOUT - 20} color={CLR_REWORK} />
              {/* 移出暂存区 → loop-back to production line */}
              <ElbowArrow
                points={[
                  [CX_LEFT, Y_REWORK_MOVEOUT + 20],
                  [CX_LEFT, Y_REWORK_MOVEOUT + 55],
                  [20, Y_REWORK_MOVEOUT + 55],
                  [20, Y_DETECT],
                  [CX_MAIN - 70, Y_DETECT],
                ]}
                label="返回产线" labelIdx={2}
                color={CLR_REWORK}
              />

              {/* ── Center: Scrap → analysis ── */}
              <Arrow x1={CX_MAIN} y1={Y_SCRAP + 20} x2={CX_MAIN} y2={Y_ANALYSIS - 20} color={CLR_ANALYSIS} />

              {/* ── Right: Salvage path ── */}
              <Arrow x1={CX_RIGHT} y1={Y_SALVAGE + 20} x2={CX_RIGHT} y2={Y_BATCH - 20} color={CLR_NCM} />
              <Arrow x1={CX_RIGHT} y1={Y_BATCH + 20} x2={CX_RIGHT} y2={Y_SALVAGE_MOVEOUT - 20} color={CLR_NCM} />
              {/* 移出暂存区 → 进入 MES 子路径 */}
              <Arrow x1={CX_RIGHT} y1={Y_SALVAGE_MOVEOUT + 20} x2={CX_RIGHT} y2={Y_CLEAN - 20} color={CLR_NCM} />
              {/* sub-route: cleaning → packing */}
              <Arrow x1={CX_RIGHT} y1={Y_CLEAN + 20} x2={CX_RIGHT} y2={Y_PACK - 20} color={CLR_NCM} />
              {/* out of sub-route → ncm_wh */}
              <Arrow x1={CX_RIGHT} y1={Y_PACK + 20} x2={CX_RIGHT} y2={Y_NCM_WH - 20} color={CLR_NCM} />
              <Arrow x1={CX_RIGHT} y1={Y_NCM_WH + 20} x2={CX_RIGHT} y2={Y_NCM_WH_OUT - 20} color={CLR_NCM} />
              <Arrow x1={CX_RIGHT} y1={Y_NCM_WH_OUT + 20} x2={CX_RIGHT} y2={Y_ERP_NCM - 20} color={CLR_ERP_NCM} />
              {/* ERP_NCM → analysis */}
              <ElbowArrow
                points={[
                  [CX_RIGHT, Y_ERP_NCM + 20],
                  [CX_RIGHT, Y_ANALYSIS],
                  [CX_MAIN + 71, Y_ANALYSIS],
                ]}
                color={CLR_ANALYSIS}
              />

              {/* ===== MES SUB-ROUTE DASHED BOX ===== */}
              <rect
                x={CX_RIGHT - BOX_W / 2 - 18}
                y={Y_CLEAN - BOX_H / 2 - 24}
                width={BOX_W + 36}
                height={Y_PACK - Y_CLEAN + BOX_H + 48}
                rx={8}
                fill="rgba(251,146,60,0.05)"
                stroke="#FB923C"
                strokeWidth={1}
                strokeDasharray="5,4"
              />
              <text
                x={CX_RIGHT}
                y={Y_CLEAN - BOX_H / 2 - 11}
                textAnchor="middle"
                fontSize={9}
                fill="#FB923C"
                opacity={0.8}
              >MES 子路径</text>

              {/* ===== NODES ===== */}

              <FlowNode id="wip" x={CX_MAIN} y={Y_WIP} label="在制品（WIP）" color={CLR_PROCESS}
                selected={selected === 'wip'} onClick={handleSelect} />
              <FlowNode id="detect" x={CX_MAIN} y={Y_DETECT} label={"工艺/量测\n站点检测"} color={CLR_PROCESS}
                selected={selected === 'detect'} onClick={handleSelect} />
              <FlowNode id="decision_ok" x={CX_MAIN} y={Y_DECISION} label="是否合格？" color={CLR_DECISION}
                selected={false} onClick={() => {}} shape="diamond" />
              <FlowNode id="pass" x={CX_RIGHT} y={Y_DECISION + 40} label={"合格 →\n继续流转"} color={CLR_OK}
                selected={selected === 'pass'} onClick={handleSelect} />
              <FlowNode id="hold" x={CX_MAIN} y={Y_HOLD} label={"自动Hold\n物理隔离"} color={CLR_HOLD}
                selected={selected === 'hold'} onClick={handleSelect} />
              <FlowNode id="mrb" x={CX_MAIN} y={Y_MRB} label={"不良品评审\n（MRB）"} color={CLR_MRB}
                selected={selected === 'mrb'} onClick={handleSelect} />
              <FlowNode id="decision_disp" x={CX_MAIN} y={Y_DECISION2} label="处置方式" color={CLR_DECISION}
                selected={false} onClick={() => {}} shape="diamond" />

              {/* Left: Rework path */}
              <FlowNode id="rework" x={CX_LEFT} y={Y_REWORK} label={"返工\n（Rework）"} color={CLR_REWORK}
                selected={selected === 'rework'} onClick={handleSelect} />
              <FlowNode id="rework_batch" x={CX_LEFT} y={Y_REWORK_BATCH} label={"攒批\nAccumulation"} color={CLR_REWORK}
                selected={selected === 'rework_batch'} onClick={handleSelect} />
              <FlowNode id="rework_moveout" x={CX_LEFT} y={Y_REWORK_MOVEOUT} label={"移出暂存区"} color={CLR_REWORK}
                selected={selected === 'rework_moveout'} onClick={handleSelect} />

              {/* Center: Scrap */}
              <FlowNode id="scrap" x={CX_MAIN} y={Y_SCRAP} label={"直接报废\n（Scrap）"} color={CLR_SCRAP}
                selected={selected === 'scrap'} onClick={handleSelect} />

              {/* Right: Salvage path */}
              <FlowNode id="salvage" x={CX_RIGHT} y={Y_SALVAGE} label={"判定残值\n进入回收"} color={CLR_SALVAGE}
                selected={selected === 'salvage'} onClick={handleSelect} />
              <FlowNode id="batch_collect" x={CX_RIGHT} y={Y_BATCH} label={"攒批\nAccumulation"} color={CLR_NCM}
                selected={selected === 'batch_collect'} onClick={handleSelect} />
              <FlowNode id="salvage_moveout" x={CX_RIGHT} y={Y_SALVAGE_MOVEOUT} label={"移出暂存区"} color={CLR_NCM}
                selected={selected === 'salvage_moveout'} onClick={handleSelect} />
              <FlowNode id="cleaning" x={CX_RIGHT} y={Y_CLEAN} label={"清洗\nCleaning"} color={CLR_NCM}
                selected={selected === 'cleaning'} onClick={handleSelect} />
              <FlowNode id="ncm_pack" x={CX_RIGHT} y={Y_PACK} label={"不良品包装\nPackaging"} color={CLR_NCM}
                selected={selected === 'ncm_pack'} onClick={handleSelect} />
              <FlowNode id="ncm_wh" x={CX_RIGHT} y={Y_NCM_WH} label={"MES线边仓\n入库"} color={CLR_NCM}
                selected={selected === 'ncm_wh'} onClick={handleSelect} />
              <FlowNode id="ncm_wh_out" x={CX_RIGHT} y={Y_NCM_WH_OUT} label={"MES线边仓\n出库"} color={CLR_NCM}
                selected={selected === 'ncm_wh_out'} onClick={handleSelect} />
              <FlowNode id="erp_ncm" x={CX_RIGHT} y={Y_ERP_NCM} label={"推送ERP\n不良品仓"} color={CLR_ERP_NCM}
                selected={selected === 'erp_ncm'} onClick={handleSelect} />

              {/* Bottom: Analysis */}
              <FlowNode id="analysis" x={CX_MAIN} y={Y_ANALYSIS} label={"数据追溯\n良率分析闭环"} color={CLR_ANALYSIS}
                selected={selected === 'analysis'} onClick={handleSelect} />
            </svg>
          </div>

          {/* Info panel */}
          <div style={{
            flex: 1,
            padding: '24px 20px',
            overflowY: 'auto',
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            minWidth: 0,
          }}>
            {selected && selectedInfo ? (
              <>
                <div style={{
                  background: 'rgba(59,130,246,0.08)',
                  border: '1px solid rgba(59,130,246,0.25)',
                  borderRadius: 10,
                  padding: '14px 18px',
                }}>
                  <h3 style={{ margin: '0 0 10px', color: '#93C5FD', fontSize: 15, fontWeight: 700, wordBreak: 'keep-all' }}>
                    {selectedInfo.title}
                  </h3>
                  <p style={{
                    margin: 0,
                    color: '#CBD5E1',
                    fontSize: 13,
                    lineHeight: 1.9,
                    whiteSpace: 'pre-line',
                    wordBreak: 'normal',
                    overflowWrap: 'break-word',
                  }}>
                    {selectedInfo.desc}
                  </p>
                </div>

                {/* Legend */}
                <div style={{ marginTop: 8 }}>
                  <p style={{ color: '#475569', fontSize: 11, margin: '0 0 10px' }}>— 节点图例 —</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {[
                      { color: CLR_PROCESS, label: '工艺节点' },
                      { color: CLR_DECISION, label: '决策判断' },
                      { color: CLR_OK, label: '合格流转' },
                      { color: CLR_HOLD, label: '锁定隔离' },
                      { color: CLR_MRB, label: 'MRB评审' },
                      { color: CLR_REWORK, label: '返工' },
                      { color: CLR_SCRAP, label: '报废' },
                      { color: CLR_SALVAGE, label: '残值回收' },
                      { color: CLR_NCM, label: 'NCM处理' },
                      { color: CLR_ERP_NCM, label: 'ERP不良品仓' },
                      { color: CLR_ANALYSIS, label: '数据分析' },
                    ].map(item => (
                      <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{
                          width: 10, height: 10, borderRadius: 2,
                          background: item.color, display: 'inline-block',
                        }} />
                        <span style={{ color: '#94A3B8', fontSize: 11 }}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{
                  marginTop: 'auto',
                  padding: '10px 14px',
                  background: 'rgba(15,23,42,0.5)',
                  borderRadius: 8,
                  border: '1px solid #1E3A5F',
                }}>
                  <p style={{ margin: 0, color: '#475569', fontSize: 11, lineHeight: 1.6 }}>
                    点击流程图中任意节点可查看对应业务说明。<br />
                    点击"×"关闭后，可在系统菜单重新查看此流程。
                  </p>
                </div>
              </>
            ) : (
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 12,
                color: '#334155',
              }}>
                <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <circle cx={12} cy={12} r={10} />
                  <path d="M12 8v4m0 4h.01" strokeLinecap="round" />
                </svg>
                <p style={{ margin: 0, fontSize: 13 }}>请点击左侧流程节点</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

