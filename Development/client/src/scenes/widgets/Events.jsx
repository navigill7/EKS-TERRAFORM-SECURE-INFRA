import FlexBetween from "components/FlexBetween";
import WidgetWrapper from "components/WidgetWrapper";
import { Calendar } from "lucide-react";

const EventsWidget = () => {
  return (
    <WidgetWrapper>
      <FlexBetween className="mb-4">
        <h3 className="text-lg font-semibold text-grey-700 dark:text-grey-200 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary-500" />
          Upcoming Events
        </h3>
      </FlexBetween>
      
      <div className="relative rounded-xl overflow-hidden mb-4 group">
        <img
          className="w-full h-auto transition-transform duration-300 group-hover:scale-105"
          alt="event"
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRCjoIq7ueZ7K5wZu7Pi6jFOqnduymcSLH6448z4lGNCMEwD8orRKUOmeV_IkScWBNm_9U&usqp=CAU"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="space-y-3">
        <h4 className="font-medium text-grey-700 dark:text-grey-200">
          About Event
        </h4>
        <p className="text-sm text-grey-600 dark:text-grey-300 leading-relaxed">
          Hackaccino is a greatest hackathon ever happen on 6th and 7th april in Bennett University
        </p>
      </div>
    </WidgetWrapper>
  );
};

export default EventsWidget;