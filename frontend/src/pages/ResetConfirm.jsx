import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import API from '../api/api';
import ActionButton from '../components/ActionButton';

function passwordStrengthScore(pw){
	if(!pw) return 0;
	let score=0;
	if(pw.length>=6) score+=1;
	if(/[A-Z]/.test(pw)) score+=1;
	if(/[0-9]/.test(pw)) score+=1;
	if(/[^A-Za-z0-9]/.test(pw)) score+=1;
	return score; // 0-4
}

export default function ResetConfirm(){
	const [searchParams] = useSearchParams();
	const initialUid = searchParams.get('uid') || '';
	const initialToken = searchParams.get('token') || '';
	const [uid, setUid] = useState(initialUid);
	const [token, setToken] = useState(initialToken);
	const [password, setPassword] = useState('');
	const [confirm, setConfirm] = useState('');
	const [status, setStatus] = useState(null);
	const [showPassword, setShowPassword] = useState(false);
	const [lastResetLink, setLastResetLink] = useState('');
	const [pasteLink, setPasteLink] = useState('');
	const [pasteError, setPasteError] = useState('');
	const [lastRequest, setLastRequest] = useState(null);
	const [lastResponse, setLastResponse] = useState(null);
	const pwRef = useRef(null);
	const navigate = useNavigate();

	useEffect(()=>{
		try{ const stored = localStorage.getItem('lastResetLink'); if(stored) setLastResetLink(stored); }catch{ /* ignore */ }
		if(!uid && searchParams.get('sent') === 'true'){
			try{
				const stored = localStorage.getItem('lastResetLink');
				if(stored){ const u = new URL(stored).searchParams.get('uid'); const t = new URL(stored).searchParams.get('token'); if(u && t){ setUid(u); setToken(t); const params = new URLSearchParams(window.location.search); params.delete('sent'); window.history.replaceState({}, '', `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`); } }
			}catch{ /* ignore */ }
		}
	}, [uid, searchParams]);

	const score = useMemo(()=>passwordStrengthScore(password),[password]);
	const strengthLabel = ['','อ่อน','ปานกลาง','แข็งแรง','ปลอดภัย'][Math.min(score,4)];

	const handleSubmit = async (e) =>{
		e.preventDefault();
		if(password.length < 6){ setStatus('too_short'); return; }
		if(password !== confirm){ setStatus('mismatch'); return; }
		setStatus('loading');
		try{
			await API.post('auth/password-reset-confirm/', { uid, token, new_password: password }, { headers: { Authorization: undefined } });
			setStatus('done');
			setTimeout(()=>navigate('/login'), 1200);
		}catch(err){ console.error(err); setStatus('error'); }
	};

	const handleRequest = async (e) =>{
		e.preventDefault();
		if(!pasteLink || String(pasteLink).trim().length === 0){ setPasteError('กรุณาใส่อีเมลหรือชื่อผู้ใช้ก่อนขอลิงก์'); return; }
		try{
			const payload = { identifier: pasteLink };
			setLastRequest(payload);
			const res = await API.post('auth/password-reset/', payload, { headers: { Authorization: undefined } });
			setLastResponse(res && res.data ? res.data : null);
			const candidate = res.data && (res.data.reset_link || res.data.resetLink || res.data.reset_url || res.data.resetUrl);
			if(candidate){ try{ localStorage.setItem('lastResetLink', candidate); }catch{ /* ignore storage errors */ } setLastResetLink(candidate); }
		}catch(err){
			console.error(err);
			if(err && err.response){ setLastResponse(err.response.data); const d = err.response.data; if(d.detail) setPasteError(String(d.detail)); else setPasteError(JSON.stringify(d)); }
			else setPasteError('เกิดข้อผิดพลาด ไม่สามารถขอลิงก์ได้');
		}
	};

	return (
		<div className="min-h-screen flex items-start justify-center px-6 py-12 bg-white dark:bg-gray-900">
			<div className="w-full max-w-3xl">
				<h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">ลืมรหัสผ่าน</h1>

				<div className="mb-4 p-4 rounded border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
					<p className="text-sm text-green-800 dark:text-green-200">เราได้สร้างลิงก์รีเซ็ตรหัสผ่านให้แล้ว (เดโม: ใช้ลิงก์ด้านล่างได้ทันที)</p>
				</div>

				<div className="mb-4 p-4 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
					{lastResetLink ? (
						<a href={lastResetLink} target="_blank" rel="noreferrer" className="text-blue-700 dark:text-blue-300 break-all">{lastResetLink}</a>
					) : (
						<p className="text-sm text-blue-700 dark:text-blue-300">(ไม่มีลิงก์ที่เก็บไว้)</p>
					)}
				</div>

				<div className="mb-6 p-4 rounded border bg-white dark:bg-gray-800">
					<form onSubmit={handleRequest} className="grid gap-3">
						<label className="text-sm text-gray-700 dark:text-gray-200">อีเมลหรือชื่อผู้ใช้</label>
						<input value={pasteLink} onChange={(e)=>{ setPasteLink(e.target.value); setPasteError(''); }} className="px-3 py-2 border rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="วางลิงก์หรือใส่อีเมล/username" />
						<div className="flex gap-2">
							<button type="submit" className="mt-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded">ขอลิงก์รีเซ็ต</button>
							<button type="button" onClick={()=>{ try{ const stored = localStorage.getItem('lastResetLink'); if(stored){ const u = new URL(stored).searchParams.get('uid'); const t = new URL(stored).searchParams.get('token'); if(u && t){ setUid(u); setToken(t); } } }catch{ /* ignore */ }}} className="mt-2 bg-gray-700 text-white py-2 px-3 rounded">ใช้ลิงก์ที่บันทึกไว้</button>
							<button type="button" onClick={()=>{ localStorage.removeItem('lastResetLink'); setLastResetLink(''); }} className="mt-2 bg-transparent border text-sm px-3 py-2 rounded">ล้างลิงก์ที่เก็บไว้</button>
						</div>
						{pasteError && <p className="text-xs text-red-400">{pasteError}</p>}
						{(lastResponse || lastRequest) && (
							<div className="mt-2 text-xs bg-gray-900 text-gray-100 p-2 rounded">
								{lastRequest && <div><strong>Last request:</strong> <pre className="whitespace-pre-wrap">{JSON.stringify(lastRequest)}</pre></div>}
								{lastResponse && <div className="mt-1"><strong>Last response:</strong> <pre className="whitespace-pre-wrap">{JSON.stringify(lastResponse)}</pre></div>}
							</div>
						)}
					</form>
				</div>

				{uid && token ? (
					<div className="p-4 rounded bg-gray-50 dark:bg-gray-800 border">
						<h2 className="text-lg font-medium mb-2 text-gray-800 dark:text-gray-200">ตั้งค่ารหัสผ่านใหม่</h2>
						<form onSubmit={handleSubmit} className="grid gap-3">
							<div>
								<input ref={pwRef} autoFocus type={showPassword ? 'text' : 'password'} value={password} onChange={(e)=>setPassword(e.target.value)} required minLength={6} className="w-full px-4 py-3 bg-white dark:bg-gray-700 border rounded" placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)" />
							</div>
							<div>
								<input type={showPassword ? 'text' : 'password'} value={confirm} onChange={(e)=>setConfirm(e.target.value)} required className="w-full px-4 py-3 bg-white dark:bg-gray-700 border rounded" placeholder="ยืนยันรหัสผ่าน" />
							</div>
							<label className="inline-flex items-center gap-2">
								<input type="checkbox" checked={showPassword} onChange={(e)=>setShowPassword(e.target.checked)} className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600" />
								<span className="text-sm text-gray-700 dark:text-gray-200">แสดงรหัสผ่าน</span>
							</label>
							<div className="h-2 bg-gray-200 rounded overflow-hidden">
								<div style={{width:`${(score/4)*100}%`}} className={`h-full ${score<2?'bg-red-500':score<3?'bg-yellow-400':'bg-green-400'}`}></div>
							</div>
							<p className="text-xs text-gray-600">ความแข็งแรง: {strengthLabel}</p>
							<div className="flex gap-2">
								<ActionButton type="submit" variant="primary">ตั้งรหัสผ่านใหม่</ActionButton>
								<ActionButton type="button" variant="outline" onClick={()=>navigate('/login')}>ยกเลิก</ActionButton>
							</div>
						</form>
						<div className="mt-3">
							{status === 'loading' && <p className="text-sm text-gray-500">กำลังบันทึก...</p>}
							{status === 'done' && <p className="text-sm text-green-600">ตั้งรหัสผ่านเรียบร้อย กำลังพาไปหน้าเข้าสู่ระบบ...</p>}
							{status === 'error' && <p className="text-sm text-red-600">ลิงก์ไม่ถูกต้องหรือหมดอายุ</p>}
							{status === 'mismatch' && <p className="text-sm text-red-600">รหัสผ่านกับการยืนยันไม่ตรงกัน</p>}
							{status === 'too_short' && <p className="text-sm text-red-600">กรุณาใช้รหัสผ่านอย่างน้อย 6 ตัวอักษร</p>}
						</div>
					</div>
				) : null}
			</div>
		</div>
	);
}
