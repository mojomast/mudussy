import { INPCData } from './types';
export interface INPCTemplate {
    id: string;
    name: string;
    description: string;
    shortDescription: string;
    dialogueProvider: string;
    behaviors: string[];
    stats: Record<string, any>;
    flags: string[];
    metadata: {
        type: string;
        version: string;
        author: string;
        description: string;
    };
}
export interface IVendorData extends INPCTemplate {
    inventory: string[];
    prices: Record<string, number>;
    currency: string;
    shopHours?: {
        open: number;
        close: number;
    };
    specialties: string[];
}
export interface IKingData extends INPCTemplate {
    kingdom: string;
    royalGuard: string[];
    decrees: string[];
    courtDate: Date;
    alliances: string[];
}
export interface ISoldierData extends INPCTemplate {
    rank: string;
    unit: string;
    commandingOfficer?: string;
    patrolRoute: string[];
    weapons: string[];
    armor: string[];
    loyalty: number;
}
export interface ICommonerData extends INPCTemplate {
    occupation: string;
    homeDistrict: string;
    dailyRoutine: string[];
    relationships: Record<string, string>;
    concerns: string[];
    wealth: 'poor' | 'middle' | 'wealthy';
}
export interface IJesterData extends INPCTemplate {
    jokes: string[];
    tricks: string[];
    instruments: string[];
    favoriteAudience: string[];
    courtPosition: boolean;
}
export interface IAnimalData extends INPCTemplate {
    species: string;
    domestication: 'wild' | 'tame' | 'domesticated';
    habitat: string[];
    diet: string[];
    behavior: 'aggressive' | 'passive' | 'skittish' | 'curious';
    packSize?: number;
    owner?: string;
}
export declare class NPCTemplateFactory {
    static createVendorTemplate(id: string, name: string, description: string, inventory?: string[], prices?: Record<string, number>, specialties?: string[]): IVendorData;
    static createKingTemplate(id: string, name: string, description: string, kingdom: string, decrees?: string[]): IKingData;
    static createSoldierTemplate(id: string, name: string, description: string, rank?: string, unit?: string): ISoldierData;
    static createCommonerTemplate(id: string, name: string, description: string, occupation?: string, homeDistrict?: string): ICommonerData;
    static createJesterTemplate(id: string, name: string, description: string, jokes?: string[], courtPosition?: boolean): IJesterData;
    static createAnimalTemplate(id: string, name: string, description: string, species: string, domestication?: 'wild' | 'tame' | 'domesticated', behavior?: 'aggressive' | 'passive' | 'skittish' | 'curious'): IAnimalData;
    static templateToNPCData(template: INPCTemplate, spawnRoomId: string, sectorId?: string): INPCData;
}
export default NPCTemplateFactory;
