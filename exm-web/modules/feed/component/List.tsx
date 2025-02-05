"use client"

import { useEffect } from "react"
import dynamic from "next/dynamic"
import { currentUserAtom } from "@/modules/JotaiProiveder"
import { IUser } from "@/modules/auth/types"
import { useAtomValue } from "jotai"
import { useInView } from "react-intersection-observer"

import LoadingCard from "@/components/ui/loading-card"
import { ScrollArea } from "@/components/ui/scroll-area"

import { useFeeds } from "../hooks/useFeed"
import { IFeed } from "../types"

const PostItem = dynamic(() => import("./PostItem"))
const EventItem = dynamic(() => import("./EventItem"))

const FeedForm = dynamic(() => import("../component/form/FeedForm"))

const List = ({ contentType }: { contentType: string }) => {
  const { ref, inView } = useInView({
    threshold: 0,
  })

  const { feeds, feedsCount, loading, handleLoadMore } = useFeeds(contentType)

  const datas = feeds || []
  const currentUser = useAtomValue(currentUserAtom) || ({} as IUser)

  const checkExmPermission =
    (currentUser.permissionActions &&
      currentUser.permissionActions.manageExmActivityFeed) ||
    false

  const pinnedList = datas.filter((data) => data.isPinned)
  const normalList = datas.filter((data) => !data.isPinned)

  const showList = (items: IFeed[]) => {
    if (contentType === "event") {
      return items.map((filteredItem: any, index) => (
        <EventItem postId={filteredItem._id} key={index} />
      ))
    }

    return items.map((filteredItem: any) => (
      <PostItem postId={filteredItem._id} key={filteredItem._id} />
    ))
  }

  useEffect(() => {
    if (inView) {
      handleLoadMore()
    }
  }, [inView, handleLoadMore])

  if (loading) {
    return (
      <ScrollArea className="h-screen">
        <FeedForm contentType={contentType} />
        <LoadingCard />
      </ScrollArea>
    )
  }

  const renderForm = () => {
    if (contentType === "publicHoliday") {
      return checkExmPermission && <FeedForm contentType={contentType} />
    }

    return <FeedForm contentType={contentType} />
  }

  return (
    <div className="h-[calc(100vh-65px)] pl-[25px] pr-[20px] overflow-auto">
      {renderForm()}
      {showList(pinnedList)}
      {showList(normalList)}

      {loading && (
        <>
          <LoadingCard type="chatlist" />
        </>
      )}

      {!loading && feeds.length < feedsCount && (
        <div ref={ref}>
          <LoadingCard />
        </div>
      )}
    </div>
  )
}

export default List
