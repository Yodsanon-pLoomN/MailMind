"use client";

import { useMemo, useState } from "react";
import type { Mail } from "@/app/types/mail";
import MailItem from "@/app/components/MailItem";
import Pagination from "@/app/components/Pagination";

type Props = {
  items: Mail[];
  perPage?: number; // default 10
};

export default function MailList({ items, perPage = 10 }: Props) {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(items.length / perPage);
  const pageItems = useMemo(
    () => items.slice((page - 1) * perPage, page * perPage),
    [items, page, perPage]
  );

  return (
    <>
      <div className="space-y-3">
        {pageItems.map((m) => (
          <MailItem key={m.id} mail={m} />
        ))}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </>
  );
}
