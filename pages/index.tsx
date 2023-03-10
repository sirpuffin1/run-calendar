import Head from "next/head";

import ActivityCalendar from "react-activity-calendar";
import Tooltip from "react-tooltip"
import { useEffect, useState } from "react";

export const getServerSideProps = async () => {
  const stravaClientId = process.env.clientId;
  const stravaClientSecret = process.env.clientSecret;
  const stravaAuthorizationCode = process.env.authorizationCode;
  const stravaRefreshToken = process.env.refreshToken;

  const todayDateString = new Date().toISOString().replace(/T.*/, "");

  const refreshStravaTokenUrl = `https://www.strava.com/oauth/token?client_id=${stravaClientId}&client_secret=${stravaClientSecret}&code=${stravaAuthorizationCode}&grant_type=refresh_token&refresh_token=${stravaRefreshToken}`;

  try {
    const res = await fetch(refreshStravaTokenUrl, {
      method: "POST",
    });
    const data = await res.json();
    const newAccessToken = data.access_token;
    try {
      const res = await fetch(
        "https://www.strava.com/api/v3/athlete/activities?access_token=" +
          newAccessToken
      );
      const athleteData = await res.json();
      let runData = athleteData.reverse().map((run: { distance: number; start_date_local: string }) => {
        const count = Math.round(run.distance / 1609);
        const date = new Date(run.start_date_local)
          .toISOString()
          .replace(/T.*/, "");
        let level;
        if (count <= 3) level = 1;
        if (count <= 6 && count > 3) level = 2;
        if (count <= 9 && count > 6) level = 3;
        if (count > 9) level = 4;
        return {
          count: count,
          date: date,
          level: level,
        };
      })

      const lastRunDate = new Date(runData[runData.length - 1].date);
    let todayDate = new Date(todayDateString);
    if (lastRunDate < todayDate) {
      runData = [...runData, { count: 0, date: todayDateString, level: 0 }];
    }

    runData = [{ count: 0, date: '2023-01-01', level: 0 }, ...runData]

      return {
        props: {
          runs: runData,
          todayDateString
        },
      };
    } catch (err) {
      return {
        props: {
          error: err
        }
      }
    }
  } catch (err) {
    return {
      props: {
        error: err
      }
    }
  }

};

export default function Home({ runs, todayDateString }: any) {
  const [isMounted, setIsMounted] = useState(false)

  

  useEffect(() => {
    setIsMounted(true)
    setTimeout(() => {
      const rectangles = document.querySelectorAll('rect')
      rectangles.forEach((rectangle) => {
        if(rectangle.dataset.tip && rectangle.dataset.tip.includes('ran 0 miles')) {
            rectangle.dataset.tip = rectangle.dataset.tip.replace('ran 0 miles', 'rested')
        }
    })
    }, 300)
    
  },[])

  return (
    <>
      <Head>
        <title>My Motivation</title>
        <meta name="description" content="An app to track daily runs" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <h1>{ todayDateString }</h1>
       
        <ActivityCalendar
        color="#ff00ff"
        data={runs}
        hideColorLegend
        hideTotalCount
        labels={{
          months: [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ],
          tooltip: `<strong>Angel ran {{count}} miles</strong> on {{date}}`,
        }}
      >
        {isMounted && <Tooltip html />}
      </ActivityCalendar>
      </main>
    </>
  );
}
