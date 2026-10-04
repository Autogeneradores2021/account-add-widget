import { Button } from '../../../components/Button'
import { useWidgetContext } from '../widgetContext'

interface AssociateButtonProps {
  onClick: () => void
}

export function AssociateButton({ onClick }: AssociateButtonProps) {
  const { options } = useWidgetContext()
  return (
    <Button className="aw-trigger" aria-haspopup="dialog" onClick={onClick}>
      {options.texts.trigger}
    </Button>
  )
}
