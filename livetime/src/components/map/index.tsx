"use client";
import dynamic from "next/dynamic";

const Loading = () => <div className="h-full min-h-64 w-full animate-pulse rounded-card bg-night-2" />;

export const EventsMap = dynamic(() => import("./events-map"), { ssr: false, loading: Loading });
export const LocationPicker = dynamic(() => import("./location-picker"), { ssr: false, loading: Loading });
