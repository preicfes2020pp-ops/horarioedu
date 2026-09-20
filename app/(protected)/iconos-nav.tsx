export function IconoInicio({ activo }: { activo: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 11.5 12 4l9 7.5M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9"
        stroke={activo ? "#1E40AF" : "#5B6270"}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconoProfesores({ activo }: { activo: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="8" r="3" stroke={activo ? "#1E40AF" : "#5B6270"} strokeWidth="1.8" />
      <path
        d="M3.5 20c0-3 2.5-5 5.5-5s5.5 2 5.5 5"
        stroke={activo ? "#1E40AF" : "#5B6270"}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M15 8.5a3 3 0 1 1 3.2 3M16.5 15.2c2.4.4 3.9 2.1 3.9 4.6"
        stroke={activo ? "#1E40AF" : "#5B6270"}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconoGrupos({ activo }: { activo: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" stroke={activo ? "#1E40AF" : "#5B6270"} strokeWidth="1.8" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" stroke={activo ? "#1E40AF" : "#5B6270"} strokeWidth="1.8" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" stroke={activo ? "#1E40AF" : "#5B6270"} strokeWidth="1.8" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" stroke={activo ? "#1E40AF" : "#5B6270"} strokeWidth="1.8" />
    </svg>
  );
}

export function IconoHorarios({ activo }: { activo: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="4.5" width="17" height="16" rx="2" stroke={activo ? "#1E40AF" : "#5B6270"} strokeWidth="1.8" />
      <path d="M3.5 9.5h17" stroke={activo ? "#1E40AF" : "#5B6270"} strokeWidth="1.8" />
      <path d="M8 3v3M16 3v3" stroke={activo ? "#1E40AF" : "#5B6270"} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconoMas({ activo }: { activo: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="5" cy="12" r="1.6" fill={activo ? "#1E40AF" : "#5B6270"} />
      <circle cx="12" cy="12" r="1.6" fill={activo ? "#1E40AF" : "#5B6270"} />
      <circle cx="19" cy="12" r="1.6" fill={activo ? "#1E40AF" : "#5B6270"} />
    </svg>
  );
}
