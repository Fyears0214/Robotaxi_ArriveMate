import React, { useEffect, useMemo, useState } from 'react';
import arriveMateIp from './assets/arrivemate-ip.png';
import locationIcon from './assets/location-icon.png';
import { scenarios } from './data/scenarios';

const STEP_STATUS = {
  boarding: '欢迎上车',
  agent_intro: '能力介绍',
  asking_purpose: '等待语音指令',
  voice_input: '已收到语音',
  understanding: 'AI 正在理解',
  intent_result: '识别完成',
  plan_confirm: '等待确认',
  executing: '计划执行中',
  arrival_reminder: '到达前提醒',
};

const DEFAULT_SCENARIO = scenarios[0];

const AUTO_PLAY_DELAYS = {
  boardingToIntro: 900,
  introToAskingPurpose: 1600,
  voiceInputToUnderstanding: 1600,
  understandingToIntentResult: 2200,
  intentResultToPlanConfirm: 2400,
};

const cabinLabels = [
  { key: 'lighting', label: '灯光', icon: '✦' },
  { key: 'music', label: '音乐', icon: '♪' },
  { key: 'seat', label: '座椅', icon: '▱' },
  { key: 'temperature', label: '温度', icon: '°' },
  { key: 'reminder', label: '提醒', icon: '!' },
];

function TripStatusBar({ scenario, showExceptionRisk }) {
  const eta = scenario.eta;
  const exception = scenario.exceptionFallback;
  const minutes = showExceptionRisk && exception?.enabled ? exception.newEtaMinutes : eta.minutes;

  return (
    <header className="trip-status-bar">
      <div className="destination-block">
        <p className="eyebrow">{scenario.destination.type}</p>
        <div className="destination-title">
          <span className="destination-icon" aria-hidden="true">
            <img src={locationIcon} alt="" />
          </span>
          <h1>{scenario.destination.name}</h1>
        </div>
      </div>
      <div className="eta-card">
        <p>预计到达</p>
        <strong>{minutes} 分钟</strong>
        <span>{eta.arrivalTime}</span>
      </div>
      <div className="status-pills" aria-label="车辆状态">
        <span data-icon="✦">{eta.autonomousStatus}</span>
        <span data-icon="✓">{eta.safetyStatus}</span>
        <span data-icon="↗">{eta.routeStatus}</span>
      </div>
    </header>
  );
}

function AgentInteractionPanel({ scenario, currentStep, messages, confirmationChoice }) {
  const userMessage = messages.find((message) => message.role === 'user');
  const aiReply = getAgentReply(scenario, currentStep, confirmationChoice);

  return (
    <article className="agent-panel">
      <div className="agent-visual">
        <div className="agent-orb" aria-hidden="true">
          <img src={arriveMateIp} alt="" />
        </div>
      </div>
      <div className="agent-content">
        <p className="eyebrow">ArriveMate</p>
        <h2>{getAgentTitle(currentStep)}</h2>
        {userMessage && currentStep !== 'boarding' ? (
          <div className="voice-transcript">
            <span>乘客语音</span>
            <p>{userMessage.text}</p>
          </div>
        ) : null}
        <p className="agent-copy">{aiReply}</p>
        <div className="agent-state">
          <span aria-hidden="true">🎙</span>
          {confirmationChoice === 'dismiss' ? '低打扰待命' : STEP_STATUS[currentStep]}
        </div>
      </div>
    </article>
  );
}

function DecisionPlanPanel({
  scenario,
  currentStep,
  activePlan,
  confirmationChoice,
  showExceptionRisk,
  onStartPlan,
  onAdjustPlan,
  onSelectAdjustment,
  onShowArrivalReminder,
  onDismissPlan,
}) {
  const isAdjustedPlan = currentStep === 'plan_confirm' && confirmationChoice?.startsWith('adjust:');
  const isExecuting = currentStep === 'executing';
  const isDismissed = confirmationChoice === 'dismiss';

  return (
    <article className={[
      'decision-panel',
      isAdjustedPlan ? 'is-adjusted-plan' : '',
      isExecuting ? 'is-executing-plan' : '',
      isDismissed ? 'is-standby-plan' : '',
    ].filter(Boolean).join(' ')}
    >
      {renderDecisionContent({
        scenario,
        currentStep,
        activePlan,
        confirmationChoice,
        showExceptionRisk,
        onStartPlan,
        onAdjustPlan,
        onSelectAdjustment,
        onShowArrivalReminder,
        onDismissPlan,
      })}
    </article>
  );
}

function CabinStatePanel({ scenario, currentStep, confirmationChoice }) {
  const showAfter = confirmationChoice?.startsWith('start') && ['executing', 'arrival_reminder'].includes(currentStep);
  const title = showAfter ? '座舱联动执行中' : '当前默认状态';

  return (
    <section className="cabin-panel" aria-label="座舱联动状态">
      <div className="section-heading cabin-heading">
        <p className="eyebrow">座舱状态</p>
        <h2>{title}</h2>
      </div>
      <div className="cabin-grid">
        {cabinLabels.map((item) => (
          <div className={showAfter ? 'cabin-card is-changed' : 'cabin-card'} key={item.key}>
            <span>
              <i aria-hidden="true">{item.icon}</i>
              {item.label}
            </span>
            <strong>
              {showAfter ? (
                <>
                  <em>{scenario.cabinBefore[item.key]}</em>
                  <b>{scenario.cabinAfter[item.key]}</b>
                </>
              ) : (
                scenario.cabinBefore[item.key]
              )}
            </strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function VoiceCommandBar({ selectedScenarioId, onVoiceCommand }) {
  return (
    <footer className="voice-command-bar" aria-label="语音指令模拟">
      <div className="voice-title">
        <p className="eyebrow">语音指令模拟</p>
      </div>
      <div className="voice-buttons">
        {scenarios.map((scenario) => (
          <button
            className={selectedScenarioId === scenario.id ? 'is-active' : ''}
            type="button"
            key={scenario.id}
            onClick={() => onVoiceCommand(scenario.id)}
          >
            {scenario.title}
          </button>
        ))}
      </div>
    </footer>
  );
}

function App() {
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);
  const [currentStep, setCurrentStep] = useState('boarding');
  const [confirmationChoice, setConfirmationChoice] = useState(null);
  const [showExceptionRisk, setShowExceptionRisk] = useState(false);
  const [messages, setMessages] = useState([]);
  const [demoStarted, setDemoStarted] = useState(false);

  const selectedScenario = useMemo(
    () => scenarios.find((scenario) => scenario.id === selectedScenarioId) || DEFAULT_SCENARIO,
    [selectedScenarioId],
  );
  const activePlan = getActivePlan(selectedScenario, confirmationChoice);

  useEffect(() => {
    if (demoStarted) {
      return undefined;
    }

    const introTimer = window.setTimeout(() => {
      setCurrentStep('agent_intro');
      setDemoStarted(true);
    }, AUTO_PLAY_DELAYS.boardingToIntro);

    return () => window.clearTimeout(introTimer);
  }, [demoStarted]);

  useEffect(() => {
    if (currentStep === 'agent_intro') {
      const askTimer = window.setTimeout(
        () => setCurrentStep('asking_purpose'),
        AUTO_PLAY_DELAYS.introToAskingPurpose,
      );
      return () => window.clearTimeout(askTimer);
    }

    if (currentStep === 'voice_input') {
      const understandTimer = window.setTimeout(() => {
        setCurrentStep('understanding');
        setMessages((currentMessages) => [
          currentMessages.find((message) => message.role === 'user'),
          { role: 'assistant', text: selectedScenario.aiReplies.understanding },
        ].filter(Boolean));
      }, AUTO_PLAY_DELAYS.voiceInputToUnderstanding);
      return () => window.clearTimeout(understandTimer);
    }

    if (currentStep === 'understanding') {
      const resultTimer = window.setTimeout(() => {
        setCurrentStep('intent_result');
        setMessages([{ role: 'assistant', text: selectedScenario.aiReplies.intent_result }]);
      }, AUTO_PLAY_DELAYS.understandingToIntentResult);
      return () => window.clearTimeout(resultTimer);
    }

    if (currentStep === 'intent_result') {
      const planTimer = window.setTimeout(
        () => setCurrentStep('plan_confirm'),
        AUTO_PLAY_DELAYS.intentResultToPlanConfirm,
      );
      return () => window.clearTimeout(planTimer);
    }

    return undefined;
  }, [currentStep, demoStarted, selectedScenario]);

  const handleVoiceCommand = (scenarioId) => {
    const scenario = scenarios.find((item) => item.id === scenarioId);
    setSelectedScenarioId(scenarioId);
    setCurrentStep('voice_input');
    setConfirmationChoice(null);
    setShowExceptionRisk(false);
    setMessages([{ role: 'user', text: scenario.voiceText }]);
    setDemoStarted(true);
  };

  const handleStartPlan = () => {
    const shouldShowException = selectedScenario.id === 'interview' && selectedScenario.exceptionFallback.enabled;
    const adjustmentId = getChoiceId(confirmationChoice, 'adjust');
    setConfirmationChoice(adjustmentId ? `start:${adjustmentId}` : 'start');
    setShowExceptionRisk(shouldShowException);
    setMessages([{ role: 'assistant', text: selectedScenario.aiReplies.executing }]);
    setCurrentStep('executing');
  };

  const handleAdjustPlan = () => {
    setConfirmationChoice('adjust');
    setShowExceptionRisk(false);
    setMessages([{ role: 'assistant', text: '你想怎么调整这份计划？我可以按场景给你更轻的版本。' }]);
    setCurrentStep('plan_confirm');
  };

  const handleSelectAdjustment = (optionId) => {
    const option = selectedScenario.adjustmentOptions.find((item) => item.id === optionId);
    setConfirmationChoice(`adjust:${optionId}`);
    setShowExceptionRisk(false);
    setMessages([{ role: 'assistant', text: `已按“${option.label}”调整计划，确认后再开启。` }]);
    setCurrentStep('plan_confirm');
  };

  const handleDismissPlan = () => {
    setConfirmationChoice('dismiss');
    setShowExceptionRisk(false);
    setMessages([{ role: 'assistant', text: '好的，我先不打扰你。你需要到达前准备时，可以随时叫我。' }]);
    setCurrentStep('plan_confirm');
  };

  const handleShowArrivalReminder = () => {
    setMessages([{ role: 'assistant', text: selectedScenario.aiReplies.arrival_reminder }]);
    setCurrentStep('arrival_reminder');
  };

  return (
    <main className="app-shell">
      <section className="screen-frame" aria-label="ArriveMate Robotaxi demo">
        <TripStatusBar scenario={selectedScenario} showExceptionRisk={showExceptionRisk} />

        <section className="main-grid">
          <AgentInteractionPanel
            scenario={selectedScenario}
            currentStep={currentStep}
            messages={messages}
            confirmationChoice={confirmationChoice}
          />
          <DecisionPlanPanel
            scenario={selectedScenario}
            currentStep={currentStep}
            activePlan={activePlan}
            confirmationChoice={confirmationChoice}
            showExceptionRisk={showExceptionRisk}
            onStartPlan={handleStartPlan}
            onAdjustPlan={handleAdjustPlan}
            onSelectAdjustment={handleSelectAdjustment}
            onShowArrivalReminder={handleShowArrivalReminder}
            onDismissPlan={handleDismissPlan}
          />
        </section>

        <CabinStatePanel
          scenario={selectedScenario}
          currentStep={currentStep}
          confirmationChoice={confirmationChoice}
        />

        <VoiceCommandBar selectedScenarioId={selectedScenarioId} onVoiceCommand={handleVoiceCommand} />
      </section>
    </main>
  );
}

function getAgentTitle(currentStep) {
  if (currentStep === 'boarding' || currentStep === 'agent_intro' || currentStep === 'asking_purpose') {
    return '欢迎上车';
  }

  if (currentStep === 'arrival_reminder') {
    return '准备到达';
  }

  return '正在准备';
}

function getAgentReply(scenario, currentStep, confirmationChoice) {
  if (confirmationChoice === 'dismiss') {
    return '好的，我先不打扰你。你需要到达前准备时，可以随时叫我。';
  }

  if (confirmationChoice === 'adjust') {
    return '你想怎么调整这份计划？可以选择一个更适合现在状态的版本。';
  }

  if (confirmationChoice?.startsWith('adjust:')) {
    const option = getAdjustmentOption(scenario, getChoiceId(confirmationChoice, 'adjust'));
    return `我已按“${option?.label || '轻量方式'}”调整计划。确认后，我再开始联动座舱。`;
  }

  if (currentStep === 'boarding') {
    return DEFAULT_SCENARIO.aiReplies.boarding;
  }

  if (currentStep === 'agent_intro') {
    return DEFAULT_SCENARIO.aiReplies.agent_intro;
  }

  if (currentStep === 'asking_purpose') {
    return DEFAULT_SCENARIO.aiReplies.asking_purpose;
  }

  return scenario.aiReplies[currentStep] || scenario.aiReplies.asking_purpose;
}

function renderDecisionContent({
  scenario,
  currentStep,
  activePlan,
  confirmationChoice,
  showExceptionRisk,
  onStartPlan,
  onAdjustPlan,
  onSelectAdjustment,
  onShowArrivalReminder,
  onDismissPlan,
}) {
  if (currentStep === 'arrival_reminder') {
    const isDismissed = confirmationChoice === 'dismiss';

    return (
      <>
        <div className="section-heading">
          <p className="eyebrow">{isDismissed ? '基础到达提醒' : '到达前提醒'}</p>
          <h2>{isDismissed ? '准备下车' : scenario.arrivalReminder.title}</h2>
        </div>
        <ArrivalReminder scenario={scenario} isDismissed={isDismissed} />
      </>
    );
  }

  if (confirmationChoice === 'dismiss') {
    return (
      <>
        <div className="section-heading">
          <p className="eyebrow">低打扰待命</p>
          <h2>暂不执行计划</h2>
        </div>
        <div className="standby-card">
          <p>好的，我先不打扰你。你需要到达前准备时，可以随时叫我。</p>
        </div>
        <div className="execution-actions standby-actions">
          <button type="button" onClick={onShowArrivalReminder}>模拟到达前提醒</button>
        </div>
      </>
    );
  }

  if (currentStep === 'voice_input') {
    return (
      <>
        <div className="section-heading">
          <p className="eyebrow">用户语音</p>
          <h2>{scenario.title}</h2>
        </div>
        <div className="voice-card">
          <p>{scenario.voiceText}</p>
        </div>
      </>
    );
  }

  if (currentStep === 'understanding') {
    return (
      <>
        <div className="section-heading">
          <p className="eyebrow">AI 理解</p>
          <h2>正在分析行程目的</h2>
        </div>
        <div className="thinking-card">
          <span aria-hidden="true" />
          <p>{scenario.aiReplies.understanding}</p>
        </div>
      </>
    );
  }

  if (currentStep === 'intent_result') {
    return (
      <>
        <div className="section-heading">
          <p className="eyebrow">识别结果</p>
          <h2>{scenario.intent.recommendedMode}</h2>
        </div>
        <IntentCard intent={scenario.intent} />
      </>
    );
  }

  if (currentStep === 'plan_confirm') {
    if (confirmationChoice === 'adjust') {
      return (
        <>
          <div className="section-heading">
            <p className="eyebrow">调整计划</p>
            <h2>选择调整方式</h2>
          </div>
          <div className="adjustment-options">
            {scenario.adjustmentOptions.map((option) => (
              <button type="button" key={option.id} onClick={() => onSelectAdjustment(option.id)}>
                <strong>{option.label}</strong>
                <span>{option.description}</span>
              </button>
            ))}
          </div>
        </>
      );
    }

    if (confirmationChoice?.startsWith('adjust:')) {
      const option = getAdjustmentOption(scenario, getChoiceId(confirmationChoice, 'adjust'));

      return (
        <>
          <div className="section-heading">
            <p className="eyebrow">调整后计划</p>
            <h2>{activePlan.title}</h2>
          </div>
          <div className="adjustment-summary">
            <strong>{option?.label || '轻量调整'}</strong>
            <span>{option?.description || '已根据当前场景收敛计划内容'}</span>
          </div>
          <PlanCards steps={activePlan.steps} />
          <div className="confirm-actions is-two-actions">
            <button type="button" onClick={onStartPlan}>立即执行</button>
            <button type="button" onClick={onDismissPlan}>暂不需要</button>
          </div>
        </>
      );
    }

    return (
      <>
        <div className="section-heading">
          <p className="eyebrow">计划确认</p>
          <h2>{activePlan.title}</h2>
        </div>
        <PlanCards steps={activePlan.steps} />
        <div className="confirm-actions">
          <button type="button" onClick={onStartPlan}>开启计划</button>
          <button type="button" onClick={onAdjustPlan}>调整计划</button>
          <button type="button" onClick={onDismissPlan}>暂不需要</button>
        </div>
      </>
    );
  }

  if (currentStep === 'executing') {
    return (
      <>
        <div className="section-heading">
          <p className="eyebrow">执行中</p>
          <h2>{activePlan.title}</h2>
        </div>
        <PlanCards steps={activePlan.steps} />
        {showExceptionRisk ? <ExceptionRiskCard fallback={scenario.exceptionFallback} /> : null}
        <div className="execution-actions">
          <button type="button" onClick={onShowArrivalReminder}>模拟到达前提醒</button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="section-heading">
        <p className="eyebrow">到达前准备</p>
        <h2>准备计划占位</h2>
      </div>
      <div className="plan-card">
        <span>01</span>
        <p>识别乘客到达后的任务和当前状态</p>
      </div>
      <div className="plan-card">
        <span>02</span>
        <p>生成轻量到达前准备计划，并等待确认</p>
      </div>
      <div className="plan-card">
        <span>03</span>
        <p>联动座舱状态，在到达前完成收口提醒</p>
      </div>
    </>
  );
}

function IntentCard({ intent }) {
  const items = [
    ['出行目的', intent.purpose],
    ['乘客状态', intent.userState],
    ['剩余车程', intent.remainingTime],
    ['核心诉求', intent.coreNeed],
  ];

  return (
    <div className="intent-grid">
      {items.map(([label, value]) => (
        <div className="intent-item" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

function PlanCards({ steps }) {
  return steps.map((step, index) => (
    <div className="plan-card" key={step}>
      <span>{String(index + 1).padStart(2, '0')}</span>
      <p>{step}</p>
    </div>
  ));
}

function ExceptionRiskCard({ fallback }) {
  return (
    <div className="exception-card">
      <strong>ETA 延误 {fallback.delayMinutes} 分钟</strong>
      <p>{fallback.reason}，{fallback.impact}。{fallback.suggestion}</p>
      <blockquote>{fallback.notificationDraft}</blockquote>
      <small>{fallback.mockNotice}</small>
    </div>
  );
}

function ArrivalReminder({ scenario, isDismissed }) {
  return (
    <div className="arrival-card">
      <p>
        {isDismissed
          ? '即将到达，请检查随身物品并准备下车。'
          : scenario.arrivalReminder.text}
      </p>
      <div className="checklist">
        {scenario.checklist.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </div>
  );
}

function getChoiceId(confirmationChoice, prefix) {
  const token = `${prefix}:`;
  return confirmationChoice?.startsWith(token) ? confirmationChoice.slice(token.length) : null;
}

function getAdjustmentOption(scenario, optionId) {
  return scenario.adjustmentOptions?.find((option) => option.id === optionId);
}

function getActivePlan(scenario, confirmationChoice) {
  const adjustmentId = getChoiceId(confirmationChoice, 'adjust') || getChoiceId(confirmationChoice, 'start');
  if (!adjustmentId) {
    return scenario.plan;
  }

  const option = getAdjustmentOption(scenario, adjustmentId);

  return option?.plan || scenario.adjustedPlan || scenario.plan;
}

export default App;
