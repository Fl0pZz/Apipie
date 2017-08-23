import { arrayOfMethods } from '../normalizeRecord.js'

export const checkRecordOnHavingMethod = (record) => {
  const httpMethod = arrayOfMethods.find(key => key in record)
  return (record.method) ||
         (record.options && record.options.method) ||
         (httpMethod && typeof record[httpMethod] === 'string')
}
