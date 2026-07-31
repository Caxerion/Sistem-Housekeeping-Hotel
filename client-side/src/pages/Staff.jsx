function Staff() {
    const staffList = [
        { id: 1, nama: "Malcolm Lockyer", posisi: "Supervisor", shift: "08.00 - 16.00", hp: "0812-3456-7890" },
        { id: 2, nama: "Neth Maguire", posisi: "Cleaner Rooms", shift: "08.00 - 16.00", hp: "0813-2345-6789" },
        { id: 3, nama: "Shining Star", posisi: "Guard", shift: "08.00 - 16.00", hp: "0857-1234-5678" },
    ];

    return (
        <div className="p-6 bg-white min-h-screen">
            <h1 className="text-2xl font-bold text-gray-800">Staff</h1>
            <p className="text-gray-500 mt-2">Daftar staff Hotel Grand Nusantara</p>

            <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm overflow-x-auto">
                <table className="w-full text-left table-auto md:table-fixed">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th className="text-gray-800 text-sm font-semibold pb-3 pr-4">Id</th>
                            <th className="text-gray-800 text-sm font-semibold pb-3 pr-4">Nama Petugas</th>
                            <th className="text-gray-800 text-sm font-semibold pb-3 pr-4">Posisi</th>
                            <th className="text-gray-800 text-sm font-semibold pb-3 pr-4">Shift</th>
                            <th className="text-gray-800 text-sm font-semibold pb-3">No. Handphone</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {staffList.map((staff) => (
                            <tr key={staff.id}>
                                <td className="py-4 pr-4 text-gray-500 text-sm">{staff.id}</td>
                                <td className="py-4 pr-4 text-gray-800 text-sm font-medium">{staff.nama}</td>
                                <td className="py-4 pr-4 text-gray-500 text-sm">{staff.posisi}</td>
                                <td className="py-4 pr-4 text-gray-500 text-sm">{staff.shift}</td>
                                <td className="py-4 text-gray-500 text-sm">{staff.hp}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Staff;