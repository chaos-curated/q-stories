
import { useState } from 'react'

type Gate = {
  name: 'H' | 'X' | 'CNOT'
  target: number
  control?: number
}

type Complex = {
  re: number
  im: number
}

type StoryOutcome = {
  title: string
  discovery: string
  consequence: string
}

const zero = (): Complex => ({ re: 0, im: 0 })

function add(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im }
}

function scale(a: Complex, value: number): Complex {
  return { re: a.re * value, im: a.im * value }
}

function magnitudeSquared(a: Complex): number {
  return a.re * a.re + a.im * a.im
}

function applyGate(state: Complex[], gate: Gate): Complex[] {
  const result = state.map(value => ({ ...value }))

  if (gate.name === 'X') {
    const step = 1 << (2 - gate.target)

    for (let i = 0; i < 8; i++) {
      if ((i & step) === 0) {
        const j = i | step
        result[i] = { ...state[j] }
        result[j] = { ...state[i] }
      }
    }
  }

  if (gate.name === 'H') {
    const step = 1 << (2 - gate.target)
    const factor = 1 / Math.sqrt(2)

    for (let i = 0; i < 8; i++) {
      if ((i & step) === 0) {
        const j = i | step

        result[i] = scale(add(state[i], state[j]), factor)
        result[j] = scale(
          add(state[i], scale(state[j], -1)),
          factor
        )
      }
    }
  }

  if (gate.name === 'CNOT' && gate.control !== undefined) {
    const controlStep = 1 << (2 - gate.control)
    const targetStep = 1 << (2 - gate.target)

    for (let i = 0; i < 8; i++) {
      const controlIsOne = (i & controlStep) !== 0
      const targetIsZero = (i & targetStep) === 0

      if (controlIsOne && targetIsZero) {
        const j = i | targetStep
        result[i] = { ...state[j] }
        result[j] = { ...state[i] }
      }
    }
  }

  return result
}

function simulate(initial: string, gates: Gate[]): Complex[] {
  const state = Array.from({ length: 8 }, zero)
  const index = parseInt(initial, 2)

  state[index] = { re: 1, im: 0 }

  return gates.reduce(
    (current, gate) => applyGate(current, gate),
    state
  )
}

function formatComplex(value: Complex): string {
  const re = Math.abs(value.re) < 0.0001 ? 0 : value.re
  const im = Math.abs(value.im) < 0.0001 ? 0 : value.im

  if (im === 0) return re.toFixed(3)
  if (re === 0) return `${im.toFixed(3)}i`

  return `${re.toFixed(3)} ${im < 0 ? '-' : '+'} ${Math.abs(im).toFixed(3)}i`
}

const storyOutcomes: Record<string, StoryOutcome> = {
  '000': {
    title: 'The Photograph That Changed',
    discovery:
      'Maya finds the boy standing beside her in the old photograph. The next morning, a red umbrella has appeared in his hand.',
    consequence:
      'The photograph has changed, but Maya cannot tell whether the image is revealing a forgotten memory or something she has never experienced.'
  },

  '001': {
    title: 'The Unfinished Lullaby',
    discovery:
      'Maya hears her mother quietly singing a lullaby that she claims never to have sung before.',
    consequence:
      'Her mother remembers two children in the song, although she insists Maya grew up alone.'
  },

  '010': {
    title: 'The Empty Birthday Seat',
    discovery:
      'An old birthday recording shows an empty place at the table and captures someone saying, "Make a wish for both of you."',
    consequence:
      'Maya begins searching for the person who was supposed to be there.'
  },

  '011': {
    title: 'The Name on the Photograph',
    discovery:
      'On the back of a photograph, Maya discovers a faint name: Arin.',
    consequence:
      'Nobody in her family admits to knowing the name, but her mother cannot hide her reaction.'
  },

  '100': {
    title: 'The Red Umbrella',
    discovery:
      'Maya discovers the same red umbrella in another photograph taken near an old railway station.',
    consequence:
      'The station becomes her next lead. Perhaps someone there remembers the boy.'
  },

  '101': {
    title: 'The Hidden Photograph',
    discovery:
      'Behind an old frame, Maya finds a second photograph showing the boy standing beside her grandmother.',
    consequence:
      'The boy may have been connected to her family long before Maya discovered the first photograph.'
  },

  '110': {
    title: 'Two Versions of the Same Day',
    discovery:
      'Two family records describe the same childhood day differently. One mentions Maya alone; the other refers to two children.',
    consequence:
      'Maya realizes that the family story contains a contradiction she must investigate.'
  },

  '111': {
    title: 'A Memory Waiting to Be Found',
    discovery:
      'The photographs, the lullaby, and the missing birthday point toward someone named Arin, a person missing from Maya’s family story.',
    consequence:
      'Maya must bring the clues together and ask her family what happened. The evidence raises questions, but it does not yet reveal the whole truth.'
  }
}

const JOURNAL_KEY = 'qstories-photograph-journal-v1'
const JOURNAL_EVENT = 'qstories-journal-update'


function saveQuantumClue(clue: string) {
  try {
    const saved = localStorage.getItem(JOURNAL_KEY)
    const parsed: unknown = saved ? JSON.parse(saved) : []

    const journal: string[] = Array.isArray(parsed)
      ? parsed.filter(
          (item): item is string => typeof item === 'string'
        )
      : []

    if (!journal.includes(clue)) {
      localStorage.setItem(
        JOURNAL_KEY,
        JSON.stringify([...journal, clue])
      )

      window.dispatchEvent(new Event(JOURNAL_EVENT))
    }
  } catch {
    // The quantum result still displays if storage is unavailable.
  }
}


export default function QuantumLab() {
  const [initial, setInitial] = useState('000')
  const [gates, setGates] = useState<Gate[]>([])
  const [measured, setMeasured] = useState<string | null>(null)
  const [targetH, setTargetH] = useState('0')
  const [targetX, setTargetX] = useState('0')
  const [control, setControl] = useState('0')
  const [targetCnot, setTargetCnot] = useState('1')

  const state = simulate(initial, gates)

  function addSingleGate(name: 'H' | 'X', target: number) {
    setGates(previous => [...previous, { name, target }])
    setMeasured(null)
  }

  function addCnot(controlQubit: number, targetQubit: number) {
    if (controlQubit === targetQubit) {
      window.alert('Choose different control and target qubits.')
      return
    }

    setGates(previous => [
      ...previous,
      {
        name: 'CNOT',
        control: controlQubit,
        target: targetQubit
      }
    ])

    setMeasured(null)
  }

function measure() {
  const probabilities = state.map(magnitudeSquared)
  const total = probabilities.reduce((sum, p) => sum + p, 0)

  if (total <= 0) return

  const random = Math.random() * total
  let cumulative = 0

  for (let i = 0; i < probabilities.length; i++) {
    cumulative += probabilities[i]

    if (random < cumulative || i === probabilities.length - 1) {
      const bitstring = i.toString(2).padStart(3, '0')
      const outcome = storyOutcomes[bitstring]

      setMeasured(bitstring)

      saveQuantumClue(
        `Quantum experiment |${bitstring}⟩ — ${outcome.title}: ${outcome.discovery} ${outcome.consequence}`
      )

      return
    }
  }
}
  function resetCircuit() {
    setGates([])
    setMeasured(null)
  }

  return (
    <section className="quantum-lab" id="quantum-lab">
      <div className="ql-heading">
        <span className="story-label">
          MAYA'S MYSTERY / QUANTUM SYSTEM
        </span>

        <h2>
          Quantum <span>Lab</span>
        </h2>

        <p>
          Configure three qubits, build a circuit, and measure the state
          to uncover clues about Maya's changing photograph.
        </p>
      </div>

      <div className="ql-panel">
        <h3>01 / Initialize the qubits</h3>

        <p className="ql-help">
          Choose a computational basis state for Q0, Q1, and Q2.
        </p>

        <div className="ql-initial">
          {['Q0', 'Q1', 'Q2'].map((qubit, index) => (
            <label key={qubit}>
              <span>{qubit}</span>

              <select
                value={initial[index]}
                onChange={event => {
                  const bits = initial.split('')
                  bits[index] = event.target.value

                  setInitial(bits.join(''))
                  setGates([])
                  setMeasured(null)
                }}
              >
                <option value="0">|0⟩</option>
                <option value="1">|1⟩</option>
              </select>
            </label>
          ))}
        </div>

        <h3>02 / Add quantum gates</h3>

        <p className="ql-help">
          H creates superposition, X flips a qubit, and CNOT flips its
          target when its control qubit is |1⟩.
        </p>

        <div className="ql-gate-controls">
          <div className="ql-gate-row">
            <strong>H</strong>
            <span>Hadamard</span>

            <select
              value={targetH}
              onChange={event => setTargetH(event.target.value)}
              aria-label="H target qubit"
            >
              <option value="0">Q0</option>
              <option value="1">Q1</option>
              <option value="2">Q2</option>
            </select>

            <button onClick={() => addSingleGate('H', Number(targetH))}>
              Add gate
            </button>
          </div>

          <div className="ql-gate-row">
            <strong>X</strong>
            <span>Pauli-X / NOT</span>

            <select
              value={targetX}
              onChange={event => setTargetX(event.target.value)}
              aria-label="X target qubit"
            >
              <option value="0">Q0</option>
              <option value="1">Q1</option>
              <option value="2">Q2</option>
            </select>

            <button onClick={() => addSingleGate('X', Number(targetX))}>
              Add gate
            </button>
          </div>

          <div className="ql-gate-row">
            <strong>⊕</strong>
            <span>CNOT</span>

            <select
              value={control}
              onChange={event => setControl(event.target.value)}
              aria-label="CNOT control qubit"
            >
              <option value="0">Control Q0</option>
              <option value="1">Control Q1</option>
              <option value="2">Control Q2</option>
            </select>

            <select
              value={targetCnot}
              onChange={event => setTargetCnot(event.target.value)}
              aria-label="CNOT target qubit"
            >
              <option value="0">Target Q0</option>
              <option value="1">Target Q1</option>
              <option value="2">Target Q2</option>
            </select>

            <button
              onClick={() =>
                addCnot(Number(control), Number(targetCnot))
              }
            >
              Add gate
            </button>
          </div>
        </div>

        <h3>03 / Your circuit</h3>

        <div className="ql-circuit">
          {['Q0', 'Q1', 'Q2'].map((qubit, qubitIndex) => (
            <div className="ql-wire" key={qubit}>
              <strong>{qubit}</strong>
              <span>|{initial[qubitIndex]}⟩</span>

              {gates.map((gate, gateIndex) => {
                if (
                  gate.target !== qubitIndex &&
                  gate.control !== qubitIndex
                ) {
                  return null
                }

                const label =
                  gate.name === 'CNOT'
                    ? gate.control === qubitIndex
                      ? '●'
                      : '⊕'
                    : gate.name

                return (
                  <span
                    className="ql-gate"
                    key={`${gate.name}-${gateIndex}-${qubitIndex}`}
                    title={
                      gate.name === 'CNOT'
                        ? `CNOT control Q${gate.control}, target Q${gate.target}`
                        : `${gate.name} on ${qubit}`
                    }
                  >
                    {label}
                  </span>
                )
              })}
            </div>
          ))}
        </div>

        <div className="ql-actions">
          <button className="ql-secondary" onClick={resetCircuit}>
            Reset circuit
          </button>

          <button className="ql-measure" onClick={measure}>
            Measure the qubits →
          </button>
        </div>

        <h3>04 / Calculated quantum state</h3>

        <div className="ql-probabilities">
          {state.map((amplitude, index) => {
            const probability = magnitudeSquared(amplitude)

            if (probability < 0.0001) return null

            const bitstring = index.toString(2).padStart(3, '0')

            return (
              <div className="ql-state-row" key={bitstring}>
                <code>|{bitstring}⟩</code>

                <span className="ql-amplitude">
                  Amplitude: {formatComplex(amplitude)}
                </span>

                <div className="ql-bar">
                  <div style={{ width: `${probability * 100}%` }} />
                </div>

                <strong>
                  {(probability * 100).toFixed(1)}%
                </strong>
              </div>
            )
          })}
        </div>

        {measured && (
          <div className="ql-result">
            <span className="story-label">
              QUANTUM RESULT / MAYA'S MYSTERY
            </span>

            <h3>|{measured}⟩</h3>

            <h2>{storyOutcomes[measured].title}</h2>

            <p>{storyOutcomes[measured].discovery}</p>
            <p>{storyOutcomes[measured].consequence}</p>

            <div className="story-next">
              <span className="scene-number">THE INVESTIGATION CONTINUES</span>

              <p>
                Your discovery has been saved to the clue journal.
                Try another circuit or measurement to uncover another
                part of Maya's mystery.
              </p>
            </div>

            <button
              className="ql-secondary"
              onClick={() => setMeasured(null)}
            >
              Run another experiment
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
