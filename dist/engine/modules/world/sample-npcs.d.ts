import { INPCData } from './types';
export declare class SampleNPCs {
    static createSampleVendors(): INPCData[];
    static createSampleKings(): INPCData[];
    static createSampleSoldiers(): INPCData[];
    static createSampleCommoners(): INPCData[];
    static createSampleJesters(): INPCData[];
    static createSampleAnimals(): INPCData[];
    static getAllSampleNPCs(): INPCData[];
    static getSampleNPCsByType(type: string): INPCData[];
}
export default SampleNPCs;
