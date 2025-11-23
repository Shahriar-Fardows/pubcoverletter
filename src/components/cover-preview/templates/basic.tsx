import type React from "react";
import Image from "next/image";
import type { CoverFormValues } from "@/components/cover-form/typs";

type BasicTemplateProps = {
  data: CoverFormValues;
};

const Basic: React.FC<BasicTemplateProps> = ({ data }) => {
  const { imageAlt } = data as unknown as { imageAlt?: string };

  return (
    <section className="">
      <div className=" border-dashed border-[#9ca3af] border-2 h-screen  justify-center items-center print:p-0 m-10 print:m-0">
        <div className="flex flex-col items-center mt-20">
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
        <div className="flex flex-col mt-6 gap-[50px] px-10 justify-between pb-20">
          <h1 className="text-center uppercase underline text-3xl">
            {data.coverTitle}
          </h1>
          <div className="flex flex-col gap-2 text-[18px]">
            <p className="text-center ">
              <span className="font-semibold">Course Name:</span>{" "}
              {data.courseName}
            </p>
            <p className="text-center ">
              <span className="font-semibold">Course Code:</span>{" "}
              {data.courseCode}
            </p>
            <p className="text-center ">
              <span className="font-semibold">Submission Date:</span>{" "}
              {data.submissionDate}
            </p>
          </div>
          <div className="flex flex-col gap-2 text-[18px]">
            <p className="text-center  italic">Submitted by</p>
            <p className="text-center  font-bold">{data.studentName}</p>
            <p className="text-center ">
              <span className="font-semibold ">Student ID:</span>{" "}
              {data.studentID}
            </p>
            <p className="text-center ">
              <span className="font-semibold ">Section:</span>{" "}
              {data.sectionBatch}
            </p>
          </div>
          <div className="flex flex-col gap-2 text-[18px]">
            <p className="text-center  italic">Submitted to</p>
            <p className="text-center  font-bold">{data.teacherName}</p>
            <p className="text-center ">{data.teacherPosition}</p>
            <p className="text-center ">{data.universityName}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 text-[18px]">
          <p className="text-center ">{data.department}</p>
          <p className="text-center ">{data.universityName}</p>
        </div>
      </div>
    </section>
  );
};

export default Basic;
