import { coverConfigAtom } from "@/store/config.store"
import { useAtomValue } from "jotai"

import { BANK_CARD_TYPES } from "@/lib/constants"

const usePaymentLabel = () => {
  const { paymentTypes } = useAtomValue(coverConfigAtom) || {}

  const getLabel = (type: string) => {
    if (type === "cash") return "Бэлнээр"
    if (type === "mobile") return "Цахимаар"
    if (type === "discount") return "Хөнгөлөлт"
    if (type === "total") return "Нийт дүн"
    if (type === BANK_CARD_TYPES.KHANBANK) return "Хаан банк"
    if (type === BANK_CARD_TYPES.GOLOMT) return "Голомт банк"
    if (type === BANK_CARD_TYPES.TDB) return "ХXБанк"
    return paymentTypes?.find((i) => i.type === type)?.title || type
  }
  return { getLabel }
}

export default usePaymentLabel
