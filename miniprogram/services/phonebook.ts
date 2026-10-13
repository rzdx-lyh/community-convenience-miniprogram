/** phonebook 资源服务（契约 phonebook:list） */
import { call } from '../utils/request';

export function listPhonebook(params: PhonebookListParams = {}): Promise<PhonebookListResult> {
  return call<PhonebookListResult>('phonebook:list', params as unknown as Record<string, unknown>);
}
