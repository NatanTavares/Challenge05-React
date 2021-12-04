import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Prismic from '@prismicio/client';
import Head from 'next/head';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { getPrismicClient } from '../../services/prismic';
import { PostFormatter } from '../../utils/PostFormatter';
import Header from '../../components/Header';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

type Post = {
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
};

type PostProps = {
  post: Post;
  pagination: {
    prevPost: {
      title: string;
      href: string;
    };
    nextPost: {
      title: string;
      href: string;
    };
  };
};

export default function Post({ post, pagination }: PostProps): JSX.Element {
  const router = useRouter();

  const estimatedReadingTime = (content: typeof post.data.content): number => {
    const wordsPerMinute = 200;

    const words = content
      .map(({ heading, body }) => {
        const totalOfWordsInTheHeading = heading && heading.split(' ').length;
        const totalOfWordsInTheBody = body[0].text.split(' ').length;

        return totalOfWordsInTheHeading + totalOfWordsInTheBody;
      })
      .reduce((acc, curr) => acc + curr, 0);

    return Math.ceil(words / wordsPerMinute);
  };

  const POST_FORMATTED = post && PostFormatter(post);

  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  return (
    <>
      <Head>
        <title>Post | {POST_FORMATTED.data.title}</title>
      </Head>

      <main>
        <div className={`${styles.headerWrapper} ${commonStyles.wrapper}`}>
          <Header />
        </div>
        <div className={styles.bannerWrapper}>
          <img src={POST_FORMATTED.data.banner.url} alt="banner" />
        </div>
        <section className={`${styles.section} ${commonStyles.wrapperWithTop}`}>
          <header>
            <h1 className={styles.title}>{POST_FORMATTED.data.title}</h1>

            <div className={styles.info}>
              <div>
                <FiCalendar />
                <span>{POST_FORMATTED.first_publication_date}</span>
              </div>

              <div>
                <FiUser />
                <span>{POST_FORMATTED.data.author}</span>
              </div>

              <div>
                <FiClock />
                <span>
                  {estimatedReadingTime(POST_FORMATTED.data.content)} min
                </span>
              </div>
            </div>

            {POST_FORMATTED.last_publication_date && (
              <p>* editado em {POST_FORMATTED.last_publication_date}</p>
            )}
          </header>

          <article>
            {POST_FORMATTED.data.content.map(content => (
              <section className={styles.content} key={content.heading}>
                <h2>{content.heading}</h2>
                <div
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{
                    __html: content.body[0].text,
                  }}
                />
              </section>
            ))}
          </article>

          <footer>
            <div>
              {pagination?.prevPost && (
                <button
                  type="button"
                  className={styles.prevButton}
                  onClick={() => {
                    router.push(pagination?.prevPost.href);
                  }}
                >
                  <p>{pagination?.prevPost.title}</p>
                  <p>Post anterior</p>
                </button>
              )}

              {pagination?.nextPost && (
                <button
                  type="button"
                  className={styles.nextButton}
                  onClick={() => {
                    router.push(pagination?.nextPost.href);
                  }}
                >
                  <p>{pagination?.nextPost.title}</p>
                  <p>Próximo post</p>
                </button>
              )}
            </div>
          </footer>
        </section>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
    }
  );

  return {
    paths: [
      ...postsResponse.results.map(post => ({
        params: {
          slug: post.uid,
        },
      })),
    ],
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const slug = context.params.slug as string;

  const response = await prismic.getByUID('posts', slug, {});
  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date || null,
    last_publication_date: response.last_publication_date || null,
    data: {
      title: response.data.title1 || response.data.title,
      banner: { url: response.data.banner.url },
      author: response.data.author,
      subtitle: response.data.subtitle1 || response.data.subtitle,
      content: response.data.content,
    },
  };

  const {
    results: [nextPost],
  } = await prismic.query(
    [
      Prismic.Predicates.at('document.type', 'posts'),
      Prismic.Predicates.dateAfter(
        'document.first_publication_date',
        response.first_publication_date ?? new Date()
      ),
    ],
    { pageSize: 1 }
  );

  const {
    results: [prevPost],
  } = await prismic.query(
    [
      Prismic.Predicates.at('document.type', 'posts'),
      Prismic.Predicates.dateBefore(
        'document.first_publication_date',
        response.first_publication_date ?? new Date()
      ),
    ],
    { pageSize: 1 }
  );

  const pagination = {
    prevPost: prevPost
      ? {
          title: prevPost.data?.title || prevPost.data?.title1,
          href: `/post/${prevPost.uid}`,
        }
      : null,

    nextPost: nextPost
      ? {
          title: nextPost.data?.title || nextPost.data?.title1,
          href: `/post/${nextPost.uid}`,
        }
      : null,
  };

  return {
    props: {
      post,
      pagination,
    },
  };
};
