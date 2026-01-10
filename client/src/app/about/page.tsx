"use client";

import React from "react";
import Image from "next/image";

export default function AboutUsPage() {
  return (
    <div className="bg-background text-foreground flex-1">
      {/* Hero Section */}
      <div className="relative h-[50vh] min-h-[400px] w-full">
        <Image
          src="https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=1974&auto=format&fit=crop"
          alt="Modern office space"
          fill
          className="object-cover"
          priority
          data-ai-hint="conference room"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white p-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight animate-fade-in-down">
            Fostering Innovation Through Collaboration
          </h1>
          <p
            className="mt-4 max-w-3xl text-lg md:text-xl text-white/90 animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            We are dedicated to creating seamless experiences that empower our
            teams to connect, create, and innovate without friction.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Our Story Section */}
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center mb-24">
            <div className="space-y-4 animate-fade-in-right">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                Our Story
              </h2>
              <div className="space-y-4 text-lg text-muted-foreground">
                <p>
                  At Innovan, we believe great ideas are born from
                  collaboration. We noticed that finding and booking a suitable
                  meeting space was often a time-consuming and fragmented
                  process, hindering the spontaneous flow of creativity and
                  teamwork.
                </p>
                <p>
                  To solve this, we created the Innovan Conference Room Booking
                  app. Our goal was to build a seamless, centralized platform
                  that allows our teams to reserve spaces effortlessly. This
                  tool removes the hurdles, so our employees can focus on what
                  they do best: innovating.
                </p>
              </div>
            </div>
            <div className="relative h-80 rounded-lg overflow-hidden animate-fade-in-left">
              <Image
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop"
                alt="Team collaborating in a meeting room"
                fill
                className="object-cover"
                data-ai-hint="team meeting"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>

          {/* Our Philosophy Section */}
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div className="relative h-80 rounded-lg overflow-hidden animate-fade-in-right order-last md:order-first">
              <Image
                src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070&auto=format&fit=crop"
                alt="Bright, modern workspace"
                fill
                className="object-cover"
                data-ai-hint="modern office"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div className="space-y-4 animate-fade-in-left">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                Our Philosophy
              </h2>
              <div className="space-y-6 text-lg text-muted-foreground">
                <div className="space-y-1">
                  <h3 className="font-semibold text-xl text-foreground/90">
                    Efficiency First
                  </h3>
                  <p>
                    We streamline administrative tasks to maximize time for
                    valuable work. Our booking system is designed to be fast,
                    intuitive, and reliable.
                  </p>
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-xl text-foreground/90">
                    Seamless Integration
                  </h3>
                  <p>
                    The right tools should feel like a natural extension of your
                    workflow. We provide a centralized platform that fits
                    effortlessly into our company's ecosystem.
                  </p>
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-xl text-foreground/90">
                    Empowering Teams
                  </h3>
                  <p>
                    By removing logistical barriers, we empower our teams to
                    focus on problem-solving, creativity, and driving the
                    business forward.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
