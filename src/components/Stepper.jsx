import React from 'react';

const isMobile = () => window.innerWidth <= 600;

const Stepper = React.memo(({ steps, activeStep }) => {
  if (typeof window !== 'undefined' && isMobile()) {
    // Mobile: show a compact progress bar and current step label
    const percent = ((activeStep + 1) / steps.length) * 100;
    return (
      <div className="neo-stepper-mobile" style={{margin:'1.2rem 0 1.2rem 0',width:'100%'}}>
        <div style={{
          display:'flex',
          justifyContent:'space-between',
          alignItems:'center',
          marginBottom:'0.3rem',
          fontSize:'1.09rem',
          fontWeight:700,
          letterSpacing:'0.01em',
        }}>
          <span
            style={{
              color:'#00bfff',
              fontWeight:700,
              fontSize:'1.09rem',
              minWidth:'80px',
              textAlign:'center',
              display:'inline-block',
              lineHeight:1.2,
            }}
          >
            {steps[activeStep]}
          </span>
          <span style={{color:'#aaa',fontSize:'0.98rem',fontWeight:500}}>Step {activeStep+1}/{steps.length}</span>
        </div>
        <div style={{width:'100%',height:'7px',background:'rgba(0,229,255,0.10)',borderRadius:'6px',overflow:'hidden'}}>
          <div className="neo-stepper-mobile-progress" style={{width:`${percent}%`}}></div>
        </div>
      </div>
    );
  }
  // Desktop: show full stepper
  return (
    <div className="neo-stepper">
      {steps.map((label, idx) => (
        <div key={label} className={`neo-step ${idx === activeStep ? 'active' : ''} ${idx < activeStep ? 'done' : ''}`}>
          <div className="neo-step-circle">{idx + 1}</div>
          <div className="neo-step-label">{label}</div>
          {idx < steps.length - 1 && <div className="neo-step-line" />}
        </div>
      ))}
    </div>
  );
});

export default Stepper;
