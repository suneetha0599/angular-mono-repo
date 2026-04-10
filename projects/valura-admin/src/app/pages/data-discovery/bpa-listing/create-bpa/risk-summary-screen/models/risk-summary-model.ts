export interface RiskCard {
  title: string;
  description: string;
  impact: string | number;
  riskType: RiskType;
}

export enum RiskType {
  PROCESSING = 'processing',
  DATA_ELEMENTS = 'data-elements',
  DATA_SECURITY = 'data-security',
  AI_RISK = 'ai-risk',
  DATA_TRANSFER = 'data-transfer',
  OVERALL = 'overall'
}

export interface DpiaRecommendation {
  isRecommended: boolean;
  reason: string;
  riskFactors: string[];
}

export interface RiskParameter {
  id: string;
  name: string;
  description?: string;
}

export interface Risk {
  id: string;
  parameter: RiskParameter;
  category: RiskCategory;
  description: string;
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  riskLevel: RiskLevel;
  createdAt: Date;
}

export enum RiskCategory {
  PROCESSING_RISK = 'PROCESSING',
  TRANSFER_RISK = 'TRANSFER',
  AI_RISK = 'AI'
}

export enum LikelihoodLevel {
  REMOTE = 'REMOTE',
  POSSIBLE = 'POSSIBLE',
  PROBABLE = 'PROBABLE'
}

export enum ImpactLevel {
  MINIMUM = 'MINIMUM',
  SIGNIFICANT = 'SIGNIFICANT',
  SEVERE = 'SEVERE'
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export interface CreateRiskRequest {
  parameter: string;
  description: string;
  likelihood: string;
  impact: string;
  categoryType: string | null;
}

export interface CreateRiskResponse {
  success: boolean;
  message: string;
  requestId: string;
  data: string;
  error: string;
}

export interface CreateParameterRequest {
  name: string;
}

export interface CreateParameterResponse {
  success: boolean;
  message: string;
  requestId: string;
  data: RiskParameter;
  error: string;
}

export interface GetParametersResponse {
  success: boolean;
  message: string;
  requestId: string;
  data: {
    parameters: RiskParameter[];
  };
  error: string | null;
}

export interface ApiRisk {
  id: number;
  parameterId: number;
  description: string;
  likelihood: string;
  impact: string;
  categoryType: string;
  parameterName: string;
}

export interface GetRisksResponse {
  success: boolean;
  message: string;
  requestId: string;
  data: {
    risksWithCategory: {
      categoryType: string;
      risks: ApiRisk[];
    }[];
  };
  error: string | null;
}

export interface OverallRiskSummary {
  totalRisks: number;
  highRisks: number;
  mediumRisks: number;
  lowRisks: number;
  averageRiskScore: number;
}

// Interfaces from risk-dialog component
export interface CategoryOption {
  value: RiskCategory;
  label: string;
}

export interface LevelOption {
  value: LikelihoodLevel | ImpactLevel;
  label: string;
}

export interface FieldDisplayNames {
  [key: string]: string;
}

// Interface from risk-table component
export interface RiskTableRow {
  rowIndex: number;
  processingRisk?: Risk;
  transferRisk?: Risk;
  aiRisk?: Risk;
}

export class RiskData {


  static calculateRiskLevel(likelihood: LikelihoodLevel, impact: ImpactLevel): RiskLevel {
    const likelihoodFactors = {
      [LikelihoodLevel.REMOTE]: 1,
      [LikelihoodLevel.POSSIBLE]: 2,
      [LikelihoodLevel.PROBABLE]: 3
    };

    const impactFactors = {
      [ImpactLevel.MINIMUM]: 1,
      [ImpactLevel.SIGNIFICANT]: 2,
      [ImpactLevel.SEVERE]: 3
    };

    const riskScore = likelihoodFactors[likelihood] * impactFactors[impact];

    if (riskScore >= 6) return RiskLevel.HIGH;
    if (riskScore >= 3) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }


  static generateRiskSummary(risks: Risk[]): OverallRiskSummary {
    const totalRisks = risks.length;
    const highRisks = risks.filter(risk => risk.riskLevel === RiskLevel.HIGH).length;
    const mediumRisks = risks.filter(risk => risk.riskLevel === RiskLevel.MEDIUM).length;
    const lowRisks = risks.filter(risk => risk.riskLevel === RiskLevel.LOW).length;
    const totalScore = risks.reduce((sum, risk) => {
      const scoreMap = { [RiskLevel.LOW]: 1, [RiskLevel.MEDIUM]: 2, [RiskLevel.HIGH]: 3 };
      return sum + scoreMap[risk.riskLevel];
    }, 0);

    const averageRiskScore = totalRisks > 0 ? Number((totalScore / totalRisks).toFixed(2)) : 0;

    return {
      totalRisks,
      highRisks,
      mediumRisks,
      lowRisks,
      averageRiskScore
    };
  }
}
