import { EMPTY_VALUE, maskAddress } from '../../../lib/maskAddress'
import type { AccountStatus } from '../types'
import { useWidgetContext } from '../widgetContext'

interface StatusTableProps {
  rows: AccountStatus[]
}

export function StatusTable({ rows }: StatusTableProps) {
  const { texts } = useWidgetContext().options

  return (
    <div className="aw-table-wrapper" role="region" aria-label={texts.tableCaption} tabIndex={0}>
      <table className="aw-table">
        <caption className="aw-visually-hidden">{texts.tableCaption}</caption>
        <thead>
          <tr>
            <th scope="col">{texts.colNiu}</th>
            <th scope="col">{texts.colStatus}</th>
            <th scope="col">{texts.colAddress}</th>
            <th scope="col">{texts.colOwner}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.niu} className={row.existe ? undefined : 'aw-table__row--missing'}>
              <td>{row.niu}</td>
              <td>
                <span className={`aw-badge aw-badge--${row.existe ? 'ok' : 'ko'}`}>
                  {row.existe ? texts.exists : texts.notExists}
                </span>
              </td>
              <td>{maskAddress(row.direccion)}</td>
              <td>{maskAddress(row.propietario) ?? (row.existe ? texts.noOwner : EMPTY_VALUE)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
