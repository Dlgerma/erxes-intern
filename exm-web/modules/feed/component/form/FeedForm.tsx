"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import Image from "next/image"
import { currentUserAtom } from "@/modules/JotaiProiveder"
import { useAtomValue } from "jotai"

import { readFile } from "@/lib/utils"
import { Card, CardHeader } from "@/components/ui/card"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

const BravoForm = dynamic(() => import("./BravoForm"))
const EventForm = dynamic(() => import("./EventForm"))
const HolidayForm = dynamic(() => import("./HolidayForm"))
const PostForm = dynamic(() => import("./PostForm"))

const FeedForm = ({ contentType }: { contentType: string }) => {
  const currentUser = useAtomValue(currentUserAtom)
  const [open, setOpen] = useState(false)

  const userDetail = currentUser?.details || {}

  const renderForm = () => {
    switch (contentType) {
      case "post":
        return <PostForm setOpen={setOpen} />
      case "publicHoliday":
        return <HolidayForm setOpen={setOpen} />
      case "bravo":
        return <BravoForm setOpen={setOpen} />
      case "event":
        return <EventForm setOpen={setOpen} />
    }
  }

  const getPLaceHolder = () => {
    switch (contentType) {
      case "post":
        return "Write a post"
      case "publicHoliday":
        return "Create a holiday"
      case "bravo":
        return "Create a bravo"
      case "event":
        return "Create event"
    }
  }

  const placeHolder = getPLaceHolder()

  return (
    <>
      <Dialog open={open} onOpenChange={() => setOpen(!open)}>
        <div className="w-full">
          <Card className="w-full mx-auto my-4 border-0">
            {contentType !== "welcome" ? (
              <CardHeader className="flex">
                <div className="flex items-center">
                  <Image
                    src={
                      userDetail.avatar
                        ? readFile(userDetail.avatar)
                        : "/avatar-colored.svg"
                    }
                    alt="User Profile"
                    width={500}
                    height={500}
                    className="w-10 h-10 rounded-full object-cover border border-primary"
                  />
                  <div className="w-full ml-4">
                    <DialogTrigger asChild={true}>
                      <div>
                        <Input
                          className="bg-[#F5F6FF] rounded-lg border-none"
                          placeholder={`${placeHolder || "place"}`}
                        />
                      </div>
                    </DialogTrigger>
                  </div>
                </div>
              </CardHeader>
            ) : null}
          </Card>
        </div>

        {open ? renderForm() : null}
      </Dialog>
    </>
  )
}

export default FeedForm
