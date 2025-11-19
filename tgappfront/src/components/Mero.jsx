import React from 'react';
import './Mero.css'

const EventsList = () => {
    const events = [
      { id: 1, title: 'Волонтерский субботник', date: '2024-01-15', location: 'Парк Победы' },
      { id: 2, title: 'Экологический марафон', date: '2024-01-20', location: 'Набережная Дона' },
      { id: 3, title: 'Очистка береговой линии', date: '2024-01-25', location: 'Левый берег Дона' },
    ];
  
    return (
      <div className="events-list">
        <div className="events">
          {events.map(event => (
            <div key={event.id} className="event-card">
              <h3>{event.title}</h3>
              <p>📅 Дата: {event.date}</p>
              <p>📍 Место: {event.location}</p>
              <button className="event-button">Участвовать</button>
            </div>
          ))}
        </div>
      </div>
    );
  };


  export default EventsList