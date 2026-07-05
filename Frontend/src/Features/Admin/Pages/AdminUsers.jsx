import React, { useEffect, useState } from 'react';
import useAdmin from '../Hook/useAdmin';

const ROLE_TABS = ['all', 'buyer', 'seller', 'admin'];

const roleBadge = (role) => {
    const map = {
        admin: 'bg-[#fce8e8] text-[#c0392b]',
        seller: 'bg-indigo-50 text-indigo-700',
        buyer: 'bg-[#F9E0D6] text-[#F37966]',
    };
    return map[role] || 'bg-[#F9E0D6] text-[#6B7280]';
};

const AdminUsers = () => {
    const { getAllUsersHandler, toggleBlockUserHandler, deleteUserHandler } = useAdmin();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState('all');
    const [search, setSearch] = useState('');
    const [busyId, setBusyId] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);

    const load = async () => {
        setLoading(true);
        try {
            const list = await getAllUsersHandler({ role, search });
            setUsers(list || []);
        } catch (e) {
            console.error('Failed to load users:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); /* eslint-disable-next-line */ }, [role]);

    const handleSearch = (e) => {
        e.preventDefault();
        load();
    };

    const handleBlock = async (u) => {
        setBusyId(u._id);
        try { await toggleBlockUserHandler(u._id); await load(); }
        catch (e) { alert(e?.response?.data?.message || 'Action failed'); }
        finally { setBusyId(null); }
    };

    const handleDelete = async (u) => {
        setBusyId(u._id);
        try { await deleteUserHandler(u._id); setConfirmDelete(null); await load(); }
        catch (e) { alert(e?.response?.data?.message || 'Delete failed'); }
        finally { setBusyId(null); }
    };

    return (
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10">
            <div className="mb-6">
                <h1 className="font-baloo text-[clamp(30px,4vw,44px)] font-light text-[#5A1A2B] leading-[1.1]">User Management</h1>
                <p className="font-poppins text-[13px] font-light text-[#6B7280] mt-2">{users.length} user(s)</p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex flex-wrap gap-2">
                    {ROLE_TABS.map((r) => (
                        <button
                            key={r}
                            onClick={() => setRole(r)}
                            className={`px-4 py-2 rounded-full font-poppins text-[11px] uppercase tracking-[0.12em] capitalize transition-all
                                ${role === r ? 'bg-[#5A1A2B] text-white' : 'bg-white border border-[#F3D9CB] text-[#6B7280] hover:border-[#F37966] hover:text-[#5A1A2B]'}`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
                <form onSubmit={handleSearch}>
                    <input
                        type="text"
                        placeholder="Search name / email…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="font-poppins px-4 py-2.5 bg-white border border-[#F3D9CB] rounded-sm text-[12px] text-[#5A1A2B] placeholder-[#C9B5A8] focus:outline-none focus:border-[#F37966] transition-colors w-56"
                    />
                </form>
            </div>

            {loading ? (
                <div className="space-y-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-16 bg-white border border-[#F3D9CB] rounded-sm animate-pulse" />
                    ))}
                </div>
            ) : users.length === 0 ? (
                <div className="bg-white border border-[#F3D9CB] rounded-sm p-10 text-center text-[13px] text-[#6B7280]">No users found.</div>
            ) : (
                <div className="bg-white border border-[#F3D9CB] rounded-sm overflow-hidden">
                    {users.map((u, idx) => (
                        <div key={u._id} className={`flex items-center gap-4 px-4 py-3 ${idx > 0 ? 'border-t border-[#F9E0D6]' : ''}`}>
                            <div className="w-9 h-9 shrink-0 rounded-full bg-[#F9E0D6] flex items-center justify-center text-[#F37966] font-medium text-[13px]">
                                {(u.fullname || '?')[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-poppins text-[13px] text-[#5A1A2B] font-medium truncate">{u.fullname}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider capitalize ${roleBadge(u.role)}`}>{u.role}</span>
                                    {u.isBlocked && <span className="px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider bg-[#fce8e8] text-[#c0392b]">Blocked</span>}
                                </div>
                                <p className="text-[12px] text-[#6B7280] truncate">{u.email}{u.contact ? ` · ${u.contact}` : ''}</p>
                            </div>

                            {u.role !== 'admin' && (
                                <div className="flex items-center gap-2 shrink-0">
                                    {confirmDelete === u._id ? (
                                        <>
                                            <button onClick={() => setConfirmDelete(null)} disabled={busyId === u._id} className="px-3 py-1.5 border border-[#F3D9CB] text-[#6B7280] rounded-sm text-[10px] uppercase tracking-[0.1em] hover:text-[#5A1A2B] disabled:opacity-50">Cancel</button>
                                            <button onClick={() => handleDelete(u)} disabled={busyId === u._id} className="px-3 py-1.5 bg-[#c0392b] text-white rounded-sm text-[10px] uppercase tracking-[0.1em] hover:bg-[#a93226] disabled:opacity-50">Confirm</button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => handleBlock(u)} disabled={busyId === u._id} className="px-3 py-1.5 border border-[#F3D9CB] text-[#5A1A2B] rounded-sm text-[10px] uppercase tracking-[0.1em] hover:bg-[#F9E0D6] disabled:opacity-50">
                                                {u.isBlocked ? 'Unblock' : 'Block'}
                                            </button>
                                            <button onClick={() => setConfirmDelete(u._id)} disabled={busyId === u._id} className="px-3 py-1.5 border border-[#F3D9CB] text-[#c0392b] rounded-sm text-[10px] uppercase tracking-[0.1em] hover:bg-[#fce8e8] disabled:opacity-50">Delete</button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
