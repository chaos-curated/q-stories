import { useEffect, useState } from 'react'

type Timeline = {
  id: number
  title: string
  label: string
  description: string
  clueTitle: string
  clue: string
  question: string
  choices: { text: string; result: string }[]
}

const timelines: Timeline[] = [
  {
    id: 1,
    title: 'The Forgotten Brother',
    label: 'MEMORY',
    description:
      'Maya asks her mother about the boy in the photograph. Her mother says Maya was an only child, but an old lullaby makes her suddenly emotional.',
    clueTitle: 'The Unfinished Lullaby',
    clue:
      'Her mother remembers singing to two children, even though she cannot explain who the second child was.',
    question: 'What should Maya do next?',
    choices: [
      {
        text: 'Ask about the lullaby',
        result:
          'Her mother remembers a name: Arin. It is the first time she has spoken it in years.',
      },
      {
        text: 'Search the family albums',
        result:
          'Maya finds a torn photograph. A small hand is still visible beside hers.',
      },
    ],
  },
  {
    id: 2,
    title: 'The Red Umbrella',
    label: 'THE OBJECT',
    description:
      'The red umbrella appears in every photograph Maya checks, even pictures taken years apart. She remembers seeing one near her childhood home.',
    clueTitle: 'The Familiar Street',
    clue:
      'An old street photograph shows the same red umbrella outside a closed railway station.',
    question: 'Where should Maya look?',
    choices: [
      {
        text: 'Visit the station',
        result:
          'Behind a loose brick, Maya finds a locker key marked with the number 17.',
      },
      {
        text: 'Inspect the photograph',
        result:
          'On the photograph’s back, someone has written: “We promised to return.”',
      },
    ],
  },
  {
    id: 3,
    title: 'The Missing Birthday',
    label: 'THE RECORDING',
    description:
      'Maya finds a birthday video from when she was seven. Everyone sings to her, but a second place at the table has been blurred.',
    clueTitle: 'The Empty Place',
    clue:
      'The recording captures a voice behind the camera saying, “Make a wish for both of you.”',
    question: 'How should Maya investigate?',
    choices: [
      {
        text: 'Listen to the audio',
        result:
          'A child’s voice says, “Maya, don’t forget our secret.”',
      },
      {
        text: 'Check the guest list',
        result:
          'A second name was scratched out, leaving only the letters A and N.',
      },
    ],
  },
  {
    id: 4,
    title: 'The Other Photograph',
    label: 'CONTRADICTION',
    description:
      'Maya develops an old film negative. This time, the stranger stands beside her grandmother, holding the same red umbrella.',
    clueTitle: 'The Hidden Date',
    clue:
      'The photo was taken on a date that family records say Maya’s grandmother spent alone.',
    question: 'Which lead should Maya follow?',
    choices: [
      {
        text: 'Question her grandmother',
        result:
          'Her grandmother says, “Some memories were hidden to protect someone, not to erase them.”',
      },
      {
        text: 'Compare the dates',
        result:
          'Maya discovers that two family records describe the same day differently.',
      },
    ],
  },
  {
    id: 5,
    title: 'The Original Memory',
    label: 'THE REVEAL',
    description:
      'Maya places every photograph, recording, and note side by side. The clues point to a child named Arin, who was part of her early life.',
    clueTitle: 'A Name Remembered',
    clue:
      'The evidence suggests Arin was someone deeply connected to Maya. Why the family stopped speaking about him remains the final question.',
    question: 'How will Maya finish the investigation?',
    choices: [
      {
        text: 'Ask her mother one last time',
        result:
          'Her mother finally admits that the family has avoided talking about Arin for years. Maya must now learn the full story from the people who remember it.',
      },
      {
        text: 'Arrange every clue by date',
        result:
          'The clues form a timeline of missing memories. Maya can see where the family story stops making sense, but she still needs to verify what happened.',
      },
    ],
  },
]

const JOURNAL_KEY = 'qstories-photograph-journal-v1'
const JOURNAL_EVENT = 'qstories-journal-update'

function loadJournal(): string[] {
  try {
    const saved = localStorage.getItem(JOURNAL_KEY)
    const parsed: unknown = saved ? JSON.parse(saved) : []

    return Array.isArray(parsed)
      ? parsed.filter(
          (item): item is string => typeof item === 'string',
        )
      : []
  } catch {
    return []
  }
}

export default function PhotographStory() {
  const [started, setStarted] = useState(false)
  const [activeTimeline, setActiveTimeline] = useState(1)
  const [activeChoice, setActiveChoice] = useState<number | null>(null)
  const [journal, setJournal] = useState<string[]>(loadJournal)

  // Refresh the journal when the Quantum Lab saves a discovery.
  useEffect(() => {
    function refreshJournal() {
      setJournal(loadJournal())
    }

    window.addEventListener(JOURNAL_EVENT, refreshJournal)

    return () => {
      window.removeEventListener(JOURNAL_EVENT, refreshJournal)
    }
  }, [])

  const timeline = timelines[activeTimeline - 1]

  function saveClue(clue: string) {
    setJournal((current) => {
      if (current.includes(clue)) return current

      const updated = [...current, clue]

      try {
        localStorage.setItem(JOURNAL_KEY, JSON.stringify(updated))
      } catch {
        // The clue remains visible in the current session.
      }

      // Notify other components that the journal has changed.
      window.dispatchEvent(new Event(JOURNAL_EVENT))

      return updated
    })
  }

  function chooseTimeline(id: number) {
    setActiveTimeline(id)
    setActiveChoice(null)
    setStarted(true)
  }

  function exploreChoice(index: number) {
    setActiveChoice(index)

    const choice = timeline.choices[index]
    saveClue(`${timeline.title}: ${choice.result}`)
  }

  function clearJournal() {
    setJournal([])

    try {
      localStorage.removeItem(JOURNAL_KEY)
    } catch {
      // Clearing the on-screen journal still works for this session.
    }

    window.dispatchEvent(new Event(JOURNAL_EVENT))
  }

  return (
    <section className="photograph-story" id="photograph-story">
      <span className="story-label">
        Q|STORIES / INTERACTIVE MYSTERY
      </span>

      <h2>
        The Photograph <span>That Remembered</span>
      </h2>

      <p>
        One photograph. One missing person. Five possible paths through
        Maya’s past.
      </p>
      {!started && (
        <div className="photograph-intro">
          <p>
            Maya finds an old family photograph showing a boy nobody
            remembers. The next morning, the picture has changed.
            To understand why, she must investigate the memories her
            family left behind.
          </p>

          <button onClick={() => setStarted(true)}>
            Begin the mystery →
          </button>
        </div>
      )}

      {started && (
        <>
          <div className="timeline-picker">
            <h3>Explore another timeline</h3>

            <div className="photograph-choices">
              {timelines.map((item) => (
                <button
                  key={item.id}
                  className={
                    activeTimeline === item.id ? 'timeline-active' : ''
                  }
                  onClick={() => chooseTimeline(item.id)}
                >
                  {String(item.id).padStart(2, '0')} · {item.title}
                </button>
              ))}
            </div>
          </div>

          <div className="timeline-content">
            <span className="story-label">
              TIMELINE {String(timeline.id).padStart(2, '0')} /{' '}
              {timeline.label}
            </span>

            <h3>{timeline.title}</h3>
            <p>{timeline.description}</p>

            <div className="photograph-clue">
              <span className="story-label">DISCOVERED EVIDENCE</span>
              <h3>{timeline.clueTitle}</h3>
              <p>{timeline.clue}</p>

              <button
                onClick={() =>
                  saveClue(
                    `${timeline.title}: ${timeline.clueTitle} — ${timeline.clue}`
                  )
                }
              >
                Save evidence to journal
              </button>
            </div>

            <h3>{timeline.question}</h3>

            <div className="photograph-choices">
              {timeline.choices.map((choice, index) => (
                <button
                  key={choice.text}
                  onClick={() => exploreChoice(index)}
                >
                  {choice.text}
                </button>
              ))}
            </div>

            {activeChoice !== null && (
              <div className="photograph-clue">
                <span className="story-label">WHAT MAYA DISCOVERS</span>
                <p>{timeline.choices[activeChoice].result}</p>
                <p>
                  This discovery has been added to your clue journal.
                  Explore another timeline to look for connections.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Always show the clue journal, even before the mystery starts. */}
      <div className="clue-journal">
        <div className="journal-heading">
          <div>
            <span className="story-label">YOUR INVESTIGATION</span>
            <h3>Clue Journal</h3>
          </div>

          <span className="journal-count">
            {journal.length} {journal.length === 1 ? 'clue' : 'clues'}
          </span>
        </div>

        {journal.length === 0 ? (
          <p>
            No clues saved yet. Run a quantum experiment or investigate
            a timeline to record your first discovery here.
          </p>
        ) : (
          <ul>
            {journal.map((clue, index) => (
              <li key={`${clue}-${index}`}>{clue}</li>
            ))}
          </ul>
        )}

        <button onClick={clearJournal}>Clear journal</button>
      </div>

      {started && (
        <button
          className="story-reset"
          onClick={() => {
            setStarted(false)
            setActiveTimeline(1)
            setActiveChoice(null)
          }}
        >
          Return to the beginning
        </button>
      )}
    </section>
  )
}