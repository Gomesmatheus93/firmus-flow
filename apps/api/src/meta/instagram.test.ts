import { describe, expect, it } from 'vitest'
import { insightsPath } from './instagram'

describe('como cada métrica é pedida à Meta', () => {
  it('views, contas engajadas e interações vão com metric_type=total_value', () => {
    // Sem esse parâmetro a Meta recusa as três. Foi o bug da primeira coleta real:
    // o @somosfirmus voltou com views, accounts_engaged e interactions vazias.
    for (const metrica of ['views', 'accounts_engaged', 'total_interactions', 'profile_links_taps']) {
      expect(insightsPath('123', metrica)).toContain('metric_type=total_value')
    }
  })

  it('reach continua como série dia a dia, sem total_value', () => {
    const caminho = insightsPath('123', 'reach')

    expect(caminho).toBe('123/insights?metric=reach&period=day')
    expect(caminho).not.toContain('total_value')
  })
})
