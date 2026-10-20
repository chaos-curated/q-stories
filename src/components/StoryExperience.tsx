
import { useState } from 'react'

export default function StoryExperience() {
  const [started, setStarted] = useState(false)

  return (
    <section className="story-experience" id="story">
      <div className="story-header">
        <span className="story-label">
          INTERACTIVE STORY · 2189
        </span>

        <h2>The Last Signal</h2>

        <p className="story-subtitle">
          One signal. Three qubits. A future that has not yet been decided.
        </p>
      </div>

      <div className="story-scene">
        <div className="story-scene-content">
          <span className="scene-number">
            CHAPTER 01 — THE DISCOVERY
          </span>

          <h3>Earth has gone silent.</h3>

          <p>
            It has been eleven minutes since the last transmission from Earth.
            Aboard the research station ECHO-7, every communication channel
            is dead.
          </p>

          <p>Then a signal arrives.</p>

          <p>
            It carries a warning, unfamiliar symbols, and a timestamp dated
            exactly seven days into the future.
          </p>

          <p>
            The station's quantum prediction system may be able to decode it.
            But first, you must choose how to run the experiment.
          </p>

          <p className="story-question">
            Is this a warning from the future—or the event that creates it?
          </p>

          {!started ? (
            <button
              className="story-start-button"
              onClick={() => setStarted(true)}
            >
              Enter the quantum lab →
            </button>
          ) : (
            <div className="lab-intro" id="quantum-lab">
              <span className="scene-number">
                QUANTUM LAB INITIALIZING
              </span>

              <h3>Your experiment begins here.</h3>

              <p>
                You will initialize three qubits, apply quantum gates, and
                measure the system. The measured result will determine what
                the crew discovers next.
              </p>

              <p>
                The circuit will calculate the quantum state and its
                measurement probabilities. Your experiment will shape the
                next chapter.
              </p>

              <p>
                <strong>Next:</strong> Build your circuit and discover what
                the signal is hiding.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
