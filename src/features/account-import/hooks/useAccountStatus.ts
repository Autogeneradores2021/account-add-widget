import { useMutation } from '@tanstack/react-query'
import { fetchAccountStatus, toApiConfig } from '../api/accountApi'
import { useWidgetContext } from '../widgetContext'

export function useAccountStatus() {
  const { options } = useWidgetContext()
  return useMutation({
    mutationKey: ['account', 'status'],
    mutationFn: (nius: string[]) => fetchAccountStatus(toApiConfig(options), nius),
  })
}
