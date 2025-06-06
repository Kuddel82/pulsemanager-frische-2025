import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

const LicenseKeyInput = ({ onValid }) => {
  const [key, setKey] = useState('');
  const [status, setStatus] = useState(null);

  const handleCheck = async () => {
    setStatus('checking');
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_key', key)
      .eq('is_active', true)
      .single();

    if (data && !error) {
      localStorage.setItem('licenseKey', key);
      setStatus('valid');
      onValid && onValid(key);
    } else {
      setStatus('invalid');
    }
  };

  return (
    <div>
      <input
        type="text"
        value={key}
        onChange={e => setKey(e.target.value)}
        placeholder="Lizenz-Key eingeben"
        className="input"
      />
      <button onClick={handleCheck} className="btn">Prüfen</button>
      {status === 'checking' && <span>Prüfe...</span>}
      {status === 'valid' && <span style={{color: 'green'}}>Lizenz gültig!</span>}
      {status === 'invalid' && <span style={{color: 'red'}}>Ungültiger Key!</span>}
    </div>
  );
};

export default LicenseKeyInput; 