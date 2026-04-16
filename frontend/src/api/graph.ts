import { request } from './request';

export interface GraphNode {
  id: string;
  question: string;
  score: number;
  topic: string;
}

export interface GraphLink {
  source: string;
  target: string;
  similarity: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export const graphApi = {
  getGraph: (topic: string) =>
    request.get<GraphData>(`/api/graph/${encodeURIComponent(topic)}`),
};
