import { useMutation } from '@tanstack/react-query'
import { associateAccounts, toApiConfig } from '../api/accountApi'
import { useWidgetContext } from '../widgetContext'

export function useAssociateAccounts() {
  const { options } = useWidgetContext()
  return useMutation({
    mutationKey: ['account', 'tercero'],
    mutationFn: (nius: string[]) =>
      associateAccounts(toApiConfig(options), {
        email: options.email,
        nius,
        sendNiuAsNumber: options.sendNiuAsNumber,
      }),
  })
}
