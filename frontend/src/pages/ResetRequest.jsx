import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';
import ActionButton from '../components/ActionButton';

export default function ResetRequest(){
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [lastResponse, setLastResponse] = useState(null);
  const [lastRequest, setLastRequest] = useState(null);
  const [resetLink, setResetLink] = useState('');
  const navigate = useNavigate();

  useEffect(()=>{
    try {
      const stored = localStorage.getItem('lastResetLink');
      if (stored) setResetLink(stored);
    } catch {
      // ignore localStorage errors in some browsers/privacy modes
      console.debug('localStorage read failed for lastResetLink');
    }
  },[]);

  const handleSubmit = async (e)=>{
    e && e.preventDefault();
    setError('');
    const id = (identifier || '').trim();
    if(!id){ setError('กรุณาใส่อีเมลหรือชื่อผู้ใช้'); return; }
    const payload = { identifier: id };
    setLastRequest(payload);
    try{
      const res = await API.post('auth/password-reset/', payload, { headers: { Authorization: undefined } });
      setLastResponse(res && res.data ? res.data : null);
      const candidate = res.data && (res.data.reset_link || res.data.resetLink || res.data.reset_url || res.data.resetUrl);
        if(candidate){
        try{ localStorage.setItem('lastResetLink', candidate); }catch{
          console.debug('localStorage write failed for lastResetLink');
        }
        setResetLink(candidate);
        // try parse uid & token and navigate to confirm
        try{
          const u = new URL(candidate);
          const qs = new URLSearchParams(u.search);
          const uid = qs.get('uid');
          const token = qs.get('token');
          if(uid && token){
            navigate(`/reset-password/confirm?uid=${encodeURIComponent(uid)}&token=${encodeURIComponent(token)}`);
            return;
          }
        }catch{
          console.debug('reset_link parsing failed');
        }
        // fallback: redirect to confirm with a sent flag
        navigate('/reset-password/confirm?sent=true');
      } else {
        // no link in response — still redirect with sent flag
        navigate('/reset-password/confirm?sent=true');
      }
    }catch(err){
      console.error(err);
      if(err && err.response){ setLastResponse(err.response.data); setError(err.response.data?.detail || JSON.stringify(err.response.data)); }
      else setError('ไม่สามารถติดต่อเซิร์ฟเวอร์ได้');
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center px-6 py-12 bg-white dark:bg-gray-900">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">ขอรับลิงก์รีเซ็ตรหัสผ่าน</h1>

        <div className="mb-4 p-4 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">ใส่อีเมลหรือชื่อผู้ใช้ของคุณ เราจะส่งลิงก์รีเซ็ตให้ ถ้าเป็นบัญชีที่มีอยู่</p>
        </div>

        <form onSubmit={handleSubmit} className="mb-6 p-4 rounded border bg-white dark:bg-gray-800">
          <label className="text-sm text-gray-700 dark:text-gray-200">อีเมลหรือชื่อผู้ใช้</label>
          <input value={identifier} onChange={(e)=>{ setIdentifier(e.target.value); setError(''); }} className="mt-2 px-3 py-2 border rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white w-full" placeholder="ใส่อีเมลหรือชื่อผู้ใช้" />
          <div className="flex gap-2 mt-3">
            <ActionButton type="submit" variant="primary">ขอลิงก์รีเซ็ต</ActionButton>
            <ActionButton variant="outline" onClick={()=>{ try{ const stored = localStorage.getItem('lastResetLink'); if(stored) setResetLink(stored); }catch{ console.debug('localStorage read failed for lastResetLink'); } }}>โหลดลิงก์ล่าสุด</ActionButton>
            <ActionButton variant="ghost" onClick={()=>{ localStorage.removeItem('lastResetLink'); setResetLink(''); }}>ล้าง</ActionButton>
            <ActionButton variant="outline" onClick={() => navigate('/login')}>ยกเลิก</ActionButton>
          </div>
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
          {(lastRequest || lastResponse) && (
            <div className="mt-2 text-xs bg-gray-900 text-gray-100 p-2 rounded">
              {lastRequest && <div><strong>Last request:</strong> <pre className="whitespace-pre-wrap">{JSON.stringify(lastRequest)}</pre></div>}
              {lastResponse && <div className="mt-1"><strong>Last response:</strong> <pre className="whitespace-pre-wrap">{JSON.stringify(lastResponse)}</pre></div>}
            </div>
          )}
        </form>

        <div className="p-4 rounded bg-white dark:bg-gray-800 border">
          <h2 className="text-lg mb-2 text-gray-800 dark:text-gray-200">ลิงก์รีเซ็ตล่าสุด</h2>
          {resetLink ? (
            <div className="flex items-center gap-3">
              <a href={resetLink} target="_blank" rel="noreferrer" className="text-blue-700 dark:text-blue-300 break-all">{resetLink}</a>
              <button onClick={()=>{ navigator.clipboard && navigator.clipboard.writeText(resetLink); }} className="bg-gray-700 text-white py-1 px-2 rounded">คัดลอก</button>
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-300">(ไม่มีลิงก์ที่บันทึกไว้)</p>
          )}
        </div>
      </div>
    </div>
  );
}
