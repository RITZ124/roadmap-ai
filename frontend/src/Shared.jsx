import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API = "http://127.0.0.1:5000";

function Shared() {

  const { data } = useParams();
  const [roadmap, setRoadmap] = useState(null);

  useEffect(() => {
    fetch(`${API}/get-shared/${data}`)
      .then(res => res.json())
      .then(setRoadmap);
  }, []);

  if (!roadmap) return <p>Loading...</p>;

  return (
    <div style={{ padding: "40px" }}>
      <h1>Shared Roadmap</h1>

      {roadmap.weeks.map((w,i)=>(
        <div key={i}>
          <h2>Week {w.week}</h2>
          {w.days.map((d,j)=>(
            <p key={j}>Day {d.day}: {d.concept}</p>
          ))}
        </div>
      ))}
    </div>
  );
}

export default Shared;