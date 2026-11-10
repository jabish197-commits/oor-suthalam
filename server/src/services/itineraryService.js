export function buildItinerary(destination, days, travelers) {
  const activities = destination.activities?.length
    ? destination.activities
    : ['Explore the town with a local guide', 'Enjoy regional food'];
  const indoor = destination.indoorActivities?.length
    ? destination.indoorActivities
    : ['Visit a local museum', 'Try an indoor cooking workshop'];
  return {
    estimatedCost: Math.round(destination.dailyBudget * days * travelers),
    itinerary: Array.from({ length: days }, (_, index) => ({
      day: index + 1,
      activities: activities.slice(
        Math.floor((index * activities.length) / days),
        Math.floor(((index + 1) * activities.length) / days),
      ).length
        ? activities.slice(
            Math.floor((index * activities.length) / days),
            Math.floor(((index + 1) * activities.length) / days),
          )
        : ['Unscheduled leisure time; check local options before travel'],
      planB: [indoor[index % indoor.length]],
    })),
  };
}
