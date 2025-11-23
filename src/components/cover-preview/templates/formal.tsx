import type React from "react";
import Image from "next/image";
import type { CoverFormValues } from "@/components/cover-form/typs";

type FormalTemplateProps = {
  data: CoverFormValues;
};

const Formal: React.FC<FormalTemplateProps> = ({ data }) => {
  const { imageAlt } = data as unknown as { imageAlt?: string };

  return (
    <section className="relative w-full h-full min-h-screen z-0 formal-print:m-0 formal-print:p-0">
      {/* Background image */}
      <Image
        src="/pubCoverpage2.png"
        alt="Formal cover background"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />

      {/* Content area */}
      <div className="relative z-10">
        <div className="flex justify-between">
          <div className="pt-4 px-6">
            <h1 className=" uppercase underline text-2xl">{data.coverTitle}</h1>
            <p className=" ">
              <span className="font-semibold">Course Name:</span>{" "}
              {data.courseName}
            </p>
            <p className=" ">
              <span className="font-semibold">Course Code:</span>{" "}
              {data.courseCode}
            </p>
            <p className=" ">
              <span className="font-semibold">Submission Date:</span>{" "}
              {data.submissionDate}
            </p>
          </div>
          <div className="px-[10%] py-[6%]">
            {data.logoUrl ? (
              <Image
                src={data.logoUrl}
                alt={imageAlt ?? "cover image"}
                width={80}
                height={80}
                style={{ objectFit: "contain" }}
              />
            ) : (
              <div className="w-40 h-24 bg-gray-100" aria-hidden />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 text-[18px] py-24 print:py-44">
          <p className="text-center  italic text-2xl">Submitted by</p>
          <p className="text-center  font-bold  text-[28px]">
            {data.studentName}
          </p>
          <p className="text-center text-2xl">
            <span className="font-semibold ">Student ID:</span> {data.studentID}
          </p>
          <div className="flex justify-center gap-4">
            <p className="text-center text-2xl">
              <span className="font-semibold ">Batch:</span> {data.batch}
            </p>
            <p className="text-center text-2xl">
              <span className="font-semibold ">Section:</span>{" "}
              {data.sectionBatch}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 text-[18px] pt-32 pb-12 print:p-20">
          <p className="text-center  italic">Submitted to</p>
          <p className="text-center  font-bold text-2xl">{data.teacherName}</p>
          <p className="text-center ">{data.teacherPosition}</p>
        </div>

        <div className="flex flex-col gap-2 text-[18px]">
          <p className="text-center ">{data.department}</p>
          <p className="text-center ">{data.universityName}</p>
        </div>
      </div>
    </section>
  );
};

export default Formal;
