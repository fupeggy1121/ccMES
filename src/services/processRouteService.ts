// src/services/processRouteService.ts
import { supabase } from '../lib/supabaseClient';

export interface ProcessStation {
  code: string;
  name: string;
  description: string;
  sequence: number; // Add sequence for sorting
}

export const processRouteService = {
  async fetchProcessStationsForProduct(productSupabaseId: string): Promise<ProcessStation[]> {
    if (!productSupabaseId) {
      return [];
    }

    try {
      // 1. Fetch main_process_route_id from products table
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('main_process_route_id')
        .eq('supabase_id', productSupabaseId)
        .single();

      if (productError) {
        console.error('Error fetching product route ID:', productError);
        return [];
      }

      if (!productData || !productData.main_process_route_id) {
        console.warn(`No main_process_route_id found for product ${productSupabaseId}`);
        return [];
      }

      const routeId = productData.main_process_route_id;

      // 2. Fetch process_route_stations for the given route_id
      const { data: routeStationsData, error: routeStationsError } = await supabase
        .from('process_route_stations')
        .select('station_id, sequence')
        .eq('route_id', routeId)
        .order('sequence', { ascending: true });

      if (routeStationsError) {
        console.error('Error fetching process route stations:', routeStationsError);
        return [];
      }

      if (!routeStationsData || routeStationsData.length === 0) {
        console.warn(`No stations found for route ${routeId}`);
        return [];
      }

      const stationIds = routeStationsData.map(rs => rs.station_id);

      // 3. Fetch station details from stations table
      const { data: stationsData, error: stationsError } = await supabase
        .from('stations')
        .select('id, code, name, description')
        .in('id', stationIds);

      if (stationsError) {
        console.error('Error fetching station details:', stationsError);
        return [];
      }

      if (!stationsData || stationsData.length === 0) {
        console.warn('No details found for the stations in the route.');
        return [];
      }

      // 4. Combine and map to ProcessStation interface, maintaining sequence order
      const processStations: ProcessStation[] = routeStationsData.map(rs => {
        const stationDetail = stationsData.find(s => s.id === rs.station_id);
        return {
          code: stationDetail?.code || 'UNKNOWN',
          name: stationDetail?.name || 'Unknown Station',
          description: stationDetail?.description || '',
          sequence: rs.sequence,
        };
      }).filter(station => station.code !== 'UNKNOWN'); // Filter out any stations that couldn't be matched

      return processStations;

    } catch (error) {
      console.error('Failed to fetch process stations for product:', error);
      return [];
    }
  },
};
