
import { useState } from 'react'
import './AcademicLab.css'

type GateName = 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T' | 'CNOT' | 'CZ' | 'SWAP'
type Complex = { re: number; im: number }
type Gate = { name: GateName; targets: number[] }

const c = (re: number, im = 0): Complex => ({ re, im })

const add = (a: Complex, b: Complex): Complex =>
  c(a.re + b.re, a.im + b.im)

const sub = (a: Complex, b: Complex): Complex =>
  c(a.re - b.re, a.im - b.im)

const mul = (a: Complex, b: Complex): Complex =>
  c(
    a.re * b.re - a.im * b.im,
    a.re * b.im + a.im * b.re
  )

const scale = (a: Complex, n: number): Complex =>
  c(a.re * n, a.im * n)

const magnitude2 = (a: Complex): number =>
  a.re * a.re + a.im * a.im

const zero = (): Complex => c(0)
const one = (): Complex => c(1)

function applySingle(
  state: Complex[],
  qubits: number,
  target: number,
  name: GateName
): Complex[] {
  const result = state.map(z => c(z.re, z.im))
  const mask = 1 << (qubits - 1 - target)
  const root = 1 / Math.sqrt(2)

  const phase =
    name === 'S'
      ? c(0, 1)
      : c(Math.SQRT1_2, Math.SQRT1_2)

  for (let i = 0; i < state.length; i++) {
    if ((i & mask) !== 0) continue

    const j = i | mask
    const a = state[i]
    const b = state[j]

    if (name === 'X') {
      result[i] = b
      result[j] = a
    } else if (name === 'Y') {
      result[i] = c(b.im, -b.re)
      result[j] = c(-a.im, a.re)
    } else if (name === 'Z') {
      result[j] = scale(b, -1)
    } else if (name === 'S' || name === 'T') {
      result[j] = mul(
        b,
        name === 'S' ? c(0, 1) : phase
      )
    } else if (name === 'H') {
      result[i] = scale(add(a, b), root)
      result[j] = scale(sub(a, b), root)
    }
  }

  return result
}

function applyControlled(
  state: Complex[],
  qubits: number,
  control: number,
  target: number,
  name: 'CNOT' | 'CZ'
): Complex[] {
  const result = state.map(z => c(z.re, z.im))
  const controlMask = 1 << (qubits - 1 - control)
  const targetMask = 1 << (qubits - 1 - target)

  if (name === 'CZ') {
    for (let i = 0; i < state.length; i++) {
      if ((i & controlMask) !== 0 && (i & targetMask) !== 0) {
        result[i] = scale(state[i], -1)
      }
    }
  } else {
    for (let i = 0; i < state.length; i++) {
      if ((i & controlMask) !== 0 && (i & targetMask) === 0) {
        const j = i | targetMask
        result[i] = state[j]
        result[j] = state[i]
      }
    }
  }

  return result
}

function applySwap(
  state: Complex[],
  qubits: number,
  first: number,
  second: number
): Complex[] {
  const result = state.map(z => c(z.re, z.im))
  const firstMask = 1 << (qubits - 1 - first)
  const secondMask = 1 << (qubits - 1 - second)

  for (let i = 0; i < state.length; i++) {
    const firstIsOne = (i & firstMask) !== 0
    const secondIsOne = (i & secondMask) !== 0

    if (!firstIsOne && secondIsOne) {
      const j = i ^ firstMask ^ secondMask
      result[i] = state[j]
      result[j] = state[i]
    }
  }

  return result
}

function applyGate(
  state: Complex[],
  qubits: number,
  gate: Gate
): Complex[] {
  if (gate.name === 'CNOT' || gate.name === 'CZ') {
    return applyControlled(
      state,
      qubits,
      gate.targets[0],
      gate.targets[1],
      gate.name
    )
  }

  if (gate.name === 'SWAP') {
    return applySwap(
      state,
      qubits,
      gate.targets[0],
      gate.targets[1]
    )
  }

  return applySingle(state, qubits, gate.targets[0], gate.name)
}

function formatComplex(z: Complex): string {
  const re = Math.abs(z.re) < 1e-10 ? 0 : z.re
  const im = Math.abs(z.im) < 1e-10 ? 0 : z.im

  if (im === 0) return re.toFixed(3)
  if (re === 0) return `${im.toFixed(3)}i`

  return `${re.toFixed(3)} ${im >= 0 ? '+' : '-'} ${Math.abs(im).toFixed(3)}i`
}

function AcademicLab() {
  const [qubits, setQubits] = useState(2)
  const [initial, setInitial] = useState('00')
  const [circuit, setCircuit] = useState<Gate[]>([])
  const [selectedGate, setSelectedGate] = useState<GateName>('H')
  const [target, setTarget] = useState(0)
  const [control, setControl] = useState(0)
  const [secondTarget, setSecondTarget] = useState(1)
  const [measured, setMeasured] = useState<string | null>(null)

  let state = Array.from(
    { length: 1 << qubits },
    () => zero()
  )

  state[parseInt(initial, 2)] = one()

  for (const gate of circuit) {
    state = applyGate(state, qubits, gate)
  }

  const probabilities = state.map(magnitude2)
  const options = Array.from({ length: qubits }, (_, i) => i)

  const isMultiGate = ['CNOT', 'CZ', 'SWAP'].includes(selectedGate)

  const addGate = () => {
    if (isMultiGate && control === secondTarget) return

    const gate: Gate = {
      name: selectedGate,
      targets: isMultiGate
        ? [control, secondTarget]
        : [target],
    }

    setCircuit(previous => [...previous, gate])
    setMeasured(null)
  }

  const reset = () => {
    setCircuit([])
    setMeasured(null)
  }

  const changeQubits = (count: number) => {
    setQubits(count)
    setInitial('0'.repeat(count))
    setTarget(0)
    setControl(0)
    setSecondTarget(count > 1 ? 1 : 0)
    setCircuit([])
    setMeasured(null)
  }

  const measure = () => {
    const random = Math.random()
    let total = 0

    for (let i = 0; i < probabilities.length; i++) {
      total += probabilities[i]

      if (random < total) {
        setMeasured(i.toString(2).padStart(qubits, '0'))
        return
      }
    }

    setMeasured('0'.repeat(qubits))
  }

  return (
    <section className="academic-lab">
      <div className="academic-heading">
        <span className="academic-eyebrow">Q|STORIES · ACADEMICS</span>
        <h1>Quantum Lab</h1>
        <p>Build multi-qubit circuits and explore quantum states.</p>
      </div>

      <div className="academic-card">
        <h2>01 · Qubit setup</h2>

        <label>
          Number of qubits
          <select
            value={qubits}
            onChange={e => changeQubits(Number(e.target.value))}
          >
            <option value={1}>1 qubit</option>
            <option value={2}>2 qubits</option>
            <option value={3}>3 qubits</option>
          </select>
        </label>

        <label>
          Initial basis state
          <select
            value={initial}
            onChange={e => {
              setInitial(e.target.value)
              setCircuit([])
              setMeasured(null)
            }}
          >
            {Array.from({ length: 1 << qubits }, (_, i) => {
              const value = i.toString(2).padStart(qubits, '0')

              return (
                <option key={value} value={value}>
                  |{value}⟩
                </option>
              )
            })}
          </select>
        </label>
      </div>

      <div className="academic-card">
        <h2>02 · Gate builder</h2>

        <label>
          Gate
          <select
            value={selectedGate}
            onChange={e =>
              setSelectedGate(e.target.value as GateName)
            }
          >
            {(
              ['H', 'X', 'Y', 'Z', 'S', 'T', 'CNOT', 'CZ', 'SWAP'] as GateName[]
            ).map(gate => (
              <option key={gate} value={gate}>
                {gate}
              </option>
            ))}
          </select>
        </label>

        {isMultiGate ? (
          <>
            <label>
              First qubit / control
              <select
                value={control}
                onChange={e => setControl(Number(e.target.value))}
              >
                {options.map(i => (
                  <option key={i} value={i}>q{i}</option>
                ))}
              </select>
            </label>

            <label>
              Second qubit / target
              <select
                value={secondTarget}
                onChange={e => setSecondTarget(Number(e.target.value))}
              >
                {options.map(i => (
                  <option key={i} value={i}>q{i}</option>
                ))}
              </select>
            </label>

            {control === secondTarget && (
              <p>Select two different qubits for this gate.</p>
            )}
          </>
        ) : (
          <label>
            Target qubit
            <select
              value={target}
              onChange={e => setTarget(Number(e.target.value))}
            >
              {options.map(i => (
                <option key={i} value={i}>q{i}</option>
              ))}
            </select>
          </label>
        )}

        <div className="academic-actions">
          <button
            className="calculate-button"
            onClick={addGate}
            disabled={isMultiGate && control === secondTarget}
          >
            Add gate
          </button>
          <button onClick={reset}>Reset circuit</button>
        </div>

        <h3>Circuit sequence</h3>

        {circuit.length === 0 ? (
          <p>No gates added yet.</p>
        ) : (
          <ol>
            {circuit.map((gate, i) => (
              <li key={i}>
                {gate.name} on {gate.targets.map(t => `q${t}`).join(' and ')}
              </li>
            ))}
          </ol>
        )}

        <div className="visual-circuit">
          <h3>Visual circuit</h3>

          {circuit.length === 0 ? (
            <p>Add a gate to see your circuit here.</p>
          ) : (
            <div className="visual-circuit-scroll">
              <div
                className="visual-circuit-grid"
                style={{
                  gridTemplateColumns: `44px repeat(${circuit.length}, 90px)`,
                }}
              >
                <div className="visual-label-column">
                  {options.map(q => (
                    <div className="visual-qubit-label" key={q}>
                      q{q}
                    </div>
                  ))}
                </div>

                {circuit.map((gate, i) => {
                  const multi = ['CNOT', 'CZ', 'SWAP'].includes(gate.name)
                  const first = gate.targets[0]
                  const second = gate.targets[1]

                  return (
                    <div className="visual-gate-column" key={i}>
                      {multi && (
                        <span
                          className="visual-connector"
                          style={{
                            top: `${Math.min(first, second) * 64 + 32}px`,
                            height: `${Math.abs(first - second) * 64}px`,
                          }}
                        />
                      )}

                      {options.map(q => {
                        let symbol = ''

                        if (!multi && gate.targets[0] === q) {
                          symbol = gate.name
                        } else if (gate.name === 'CNOT') {
                          if (q === first) symbol = '●'
                          if (q === second) symbol = '⊕'
                        } else if (gate.name === 'CZ') {
                          if (q === first || q === second) symbol = '●'
                        } else if (gate.name === 'SWAP') {
                          if (q === first || q === second) symbol = '×'
                        }

                        return (
                          <div className="visual-gate-cell" key={q}>
                            {symbol && (
                              <span
                                className={`visual-gate ${
                                  multi ? 'visual-multi-gate' : ''
                                }`}
                              >
                                {symbol}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="academic-card">
        <h2>03 · State vector</h2>
        <p>
          Amplitudes are complex numbers. The probability of a basis state
          is the squared magnitude of its amplitude.
        </p>

        <div className="state-list">
          {state.map((amplitude, i) => (
            <div className="state-item" key={i}>
              <code>|{i.toString(2).padStart(qubits, '0')}⟩</code>
              <span>{formatComplex(amplitude)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="academic-card">
        <h2>04 · Measurement probabilities</h2>

        {probabilities.map((p, i) => (
          <div className="probability-row" key={i}>
            <div className="probability-heading">
              <span>|{i.toString(2).padStart(qubits, '0')}⟩</span>
              <strong>{(p * 100).toFixed(1)}%</strong>
            </div>

            <div className="probability-track">
              <div
                className="probability-fill"
                style={{ width: `${p * 100}%` }}
              />
            </div>
          </div>
        ))}

        <button className="calculate-button" onClick={measure}>
          Measure all qubits
        </button>

        {measured !== null && (
          <div className="academic-result">
            <h3>Measured result: |{measured}⟩</h3>
            <p>
              One result is sampled from the calculated probability
              distribution.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

export default AcademicLab

