// modules/mes/services/dataGenerator.ts
import { supabase } from '../lib/supabase';

export class DataGenerator {
  private equipmentIds = ['E-001', 'E-002', 'E-003', 'E-004', 'E-005'];
  private productIds = ['P-001', 'P-002', 'P-003', 'P-004', 'P-005'];
  private shifts = ['A', 'B', 'C'];
  private equipmentTypes = ['Assembly', 'Testing', 'Packaging', 'Inspection', 'Machining'];

  async generateAllData(): Promise<void> {
    console.log('Starting data generation...');

    // 检查并生成 equipment 数据
    const hasEquipmentData = await this.checkExistingEquipmentData();
    if (!hasEquipmentData) {
      await this.generateEquipment();
      console.log('✅ Equipment data generated.');
    } else {
      console.log('⚠️ Equipment data already exists, skipping generation.');
    }

    // 检查并生成 production_events 数据
    const hasProductionEventsData = await this.checkExistingProductionEventsData();
    if (!hasProductionEventsData) {
      await this.generateProductionEvents();
      console.log('✅ Production events data generated.');
    } else {
      console.log('⚠️ Production events data already exists, skipping generation.');
    }

    // 检查并生成 oee_records 数据
    const hasOEERecordsData = await this.checkExistingOEERecordsData();
    if (!hasOEERecordsData) {
      await this.generateOEERecords();
      console.log('✅ OEE records data generated.');
    } else {
      console.log('⚠️ OEE records data already exists, skipping generation.');
    }

    // 检查并生成 quality_records 数据
    const hasQualityRecordsData = await this.checkExistingQualityRecordsData();
    if (!hasQualityRecordsData) {
      await this.generateQualityRecords();
      console.log('✅ Quality records data generated.');
    } else {
      console.log('⚠️ Quality records data already exists, skipping generation.');
    }

    console.log('Data generation process completed!');
  }

  private async checkExistingEquipmentData(): Promise<boolean> {
    const { data } = await supabase
      .from('equipment')
      .select('id')
      .limit(1)
      .maybeSingle();
    return data !== null;
  }

  private async checkExistingProductionEventsData(): Promise<boolean> {
    const { data } = await supabase
      .from('production_events')
      .select('id')
      .limit(1)
      .maybeSingle();
    return data !== null;
  }

  private async checkExistingOEERecordsData(): Promise<boolean> {
    const { data } = await supabase
      .from('oee_records')
      .select('id')
      .limit(1)
      .maybeSingle();
    return data !== null;
  }

  private async checkExistingQualityRecordsData(): Promise<boolean> {
    const { data } = await supabase
      .from('quality_records')
      .select('id')
      .limit(1)
      .maybeSingle();
    return data !== null;
  }

  private async generateEquipment(): Promise<void> {
    const equipment = this.equipmentIds.map((id, index) => ({
      equipment_id: id,
      equipment_name: `${this.equipmentTypes[index]} Machine ${id}`,
      equipment_type: this.equipmentTypes[index],
      status: ['RUNNING', 'RUNNING', 'STOPPED', 'RUNNING', 'MAINTENANCE'][index]
    }));

    const { error } = await supabase
      .from('equipment')
      .insert(equipment);

    if (error) {
      console.error('Error generating equipment:', error);
    } else {
      console.log(`Generated ${equipment.length} equipment records`);
    }
  }

  private async generateProductionEvents(): Promise<void> {
    const events = [];
    const now = new Date();

    for (let day = 30; day >= 0; day--) {
      for (const equipmentId of this.equipmentIds) {
        for (const shift of this.shifts) {
          const date = new Date(now);
          date.setDate(date.getDate() - day);
          date.setHours(shift === 'A' ? 8 : shift === 'B' ? 16 : 0);

          const outputQty = Math.floor(Math.random() * 200) + 100;
          const goodQty = Math.floor(outputQty * (0.85 + Math.random() * 0.15));
          const defectQty = outputQty - goodQty;

          events.push({
            equipment_id: equipmentId,
            event_type: 'PRODUCTION',
            product_id: this.productIds[Math.floor(Math.random() * this.productIds.length)],
            shift,
            operator: `OP-${String(Math.floor(Math.random() * 20) + 1).padStart(3, '0')}`,
            output_qty: outputQty,
            good_qty: goodQty,
            defect_qty: defectQty,
            cycle_time: 25 + Math.random() * 10,
            downtime: Math.random() * 30,
            timestamp: date.toISOString()
          });
        }
      }
    }

    const batchSize = 100;
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      const { error } = await supabase
        .from('production_events')
        .insert(batch);

      if (error) {
        console.error('Error generating production events:', error);
      }
    }

    console.log(`Generated ${events.length} production events`);
  }

  private async generateOEERecords(): Promise<void> {
    const records = [];
    const now = new Date();

    for (let day = 30; day >= 0; day--) {
      for (const equipmentId of this.equipmentIds) {
        for (const shift of this.shifts) {
          const date = new Date(now);
          date.setDate(date.getDate() - day);

          const availability = 75 + Math.random() * 20;
          const performance = 80 + Math.random() * 15;
          const quality = 95 + Math.random() * 5;
          const oee = (availability * performance * quality) / 10000;

          const plannedTime = 480;
          const actualTime = plannedTime * (availability / 100);
          const totalOutput = Math.floor(Math.random() * 200) + 100;
          const goodOutput = Math.floor(totalOutput * (quality / 100));

          records.push({
            equipment_id: equipmentId,
            date: date.toISOString().split('T')[0],
            shift,
            availability: Math.round(availability * 100) / 100,
            performance: Math.round(performance * 100) / 100,
            quality: Math.round(quality * 100) / 100,
            oee: Math.round(oee * 100) / 100,
            planned_time: plannedTime,
            actual_time: Math.round(actualTime),
            total_output: totalOutput,
            good_output: goodOutput
          });
        }
      }
    }

    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const { error } = await supabase
        .from('oee_records')
        .insert(batch);

      if (error && !error.message.includes('duplicate key')) {
        console.error('Error generating OEE records:', error);
      }
    }

    console.log(`Generated ${records.length} OEE records`);
  }

  private async generateQualityRecords(): Promise<void> {
    const records = [];
    const now = new Date();
    const measurementTypes = [
      { type: 'thickness', unit: 'mm', lower: 0.8, upper: 1.2, target: 1.0 },
      { type: 'weight', unit: 'g', lower: 95, upper: 105, target: 100 },
      { type: 'diameter', unit: 'mm', lower: 9.8, upper: 10.2, target: 10.0 },
      { type: 'length', unit: 'mm', lower: 49.5, upper: 50.5, target: 50.0 }
    ];

    for (let day = 30; day >= 0; day--) {
      for (const equipmentId of this.equipmentIds) {
        for (let sample = 0; sample < 20; sample++) {
          const date = new Date(now);
          date.setDate(date.getDate() - day);
          date.setHours(Math.floor(Math.random() * 24));
          date.setMinutes(Math.floor(Math.random() * 60));

          const measurement = measurementTypes[Math.floor(Math.random() * measurementTypes.length)];
          const variation = (Math.random() - 0.5) * 0.3;
          const value = measurement.target + variation;
          const status = value >= measurement.lower && value <= measurement.upper ? 'PASS' : 'FAIL';

          records.push({
            equipment_id: equipmentId,
            product_id: this.productIds[Math.floor(Math.random() * this.productIds.length)],
            measurement_type: measurement.type,
            measurement_value: Math.round(value * 100) / 100,
            unit: measurement.unit,
            upper_limit: measurement.upper,
            lower_limit: measurement.lower,
            status,
            shift: this.shifts[Math.floor(Math.random() * 3)],
            timestamp: date.toISOString()
          });
        }
      }
    }

    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const { error } = await supabase
        .from('quality_records')
        .insert(batch);

      if (error) {
        console.error('Error generating quality records:', error);
      }
    }

    console.log(`Generated ${records.length} quality records`);
  }
}

export const dataGenerator = new DataGenerator();
