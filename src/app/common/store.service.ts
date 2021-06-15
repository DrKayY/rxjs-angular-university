import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { fromPromise } from "rxjs/internal-compatibility";
import { filter, map, tap } from "rxjs/operators";
import { Course } from "../model/course";
import { Lesson } from "../model/lesson";
import { createHttpObservable } from "./util";

@Injectable({
  providedIn: "root",
})
export class StoreService {
  private subject = new BehaviorSubject<Course[]>([]);
  courses$: Observable<Course[]> = this.subject.asObservable();

  constructor() {}

  init() {
    const http$ = createHttpObservable("/api/courses");

    http$
      .pipe(
        tap(() => console.log("HTTP request executed")),
        map((res) => Object.values(res["payload"]))
      )
      .subscribe((courses) => this.subject.next(courses));
  }

  selectBeginnerCourses(): Observable<Course[]> {
    return this.filerCoursesByCategory("BEGINNER");
  }

  selectAdvancedCourses(): Observable<Course[]> {
    return this.filerCoursesByCategory("ADVANCED");
  }

  filerCoursesByCategory(category: string) {
    return this.courses$.pipe(
      map((courses) => courses.filter((course) => course.category == category))
    );
  }

  saveChanges(courseId: number, changes): Observable<any> {
    const courses = this.subject.value;
    const courseIndexToUpdate = courses.findIndex(
      (course) => course.id == courseId
    );
    const newCourses = courses.slice(0);
    newCourses[courseIndexToUpdate] = {
      ...courses[courseIndexToUpdate],
      ...changes,
    };

    this.subject.next(newCourses);

    return fromPromise(
      fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        body: JSON.stringify(changes),
        headers: {
          "content-type": "application/json",
        },
      })
    );
  }

  selectCourseById(courseId: number): Observable<Course> {
    return this.courses$
      .pipe(
        map((courses) => courses.find(course => course.id == courseId)),
        filter(course => !!course)
      );
  }
}
