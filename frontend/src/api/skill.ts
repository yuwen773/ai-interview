import { request } from './request';
import type { SkillDTO, CategoryDTO } from '../types/skill';

export { type SkillDTO, type CategoryDTO, type DisplayDTO } from '../types/skill';

export const skillApi = {
  async listSkills(): Promise<SkillDTO[]> {
    return request.get<SkillDTO[]>('/api/interview/skills');
  },

  async getSkill(id: string): Promise<SkillDTO> {
    return request.get<SkillDTO>(`/api/interview/skills/${id}`);
  },

  async parseJd(jdText: string): Promise<CategoryDTO[]> {
    return request.post<CategoryDTO[]>('/api/interview/skills/parse-jd', { jdText });
  },
};